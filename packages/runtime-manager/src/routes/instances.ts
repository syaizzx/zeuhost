import { Router, Request, Response } from "express";
import { z } from "zod";
import { dockerSandbox } from "../docker/client";

export const instancesRouter = Router();

const spawnSchema = z.object({
  instanceId: z.string().min(1),
  image: z.string().min(1),
  env: z.record(z.string(), z.string()).default({}),
  memoryMb: z.number().int().min(128).max(4096).default(256),
  cpuCores: z.number().min(0.1).max(2.0).default(0.5),
});

instancesRouter.post("/spawn", async (req: Request, res: Response): Promise<void> => {
  const parseResult = spawnSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid payload parameters", details: parseResult.error.format() });
    return;
  }

  const { instanceId, image, env, memoryMb, cpuCores } = parseResult.data;

  try {
    const containerId = await dockerSandbox.createHardenedContainer({
      instanceId,
      image,
      env,
      memoryMb,
      cpuCores,
    });

    await dockerSandbox.startContainer(containerId);

    res.status(201).json({
      success: true,
      instanceId,
      containerId,
      status: "RUNNING",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to spawn container";
    res.status(500).json({ success: false, instanceId, error: message });
  }
});

instancesRouter.post("/:id/start", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  try {
    await dockerSandbox.startContainer(containerId);
    res.json({ success: true, containerId, status: "RUNNING" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start container";
    res.status(500).json({ success: false, containerId, error: message });
  }
});

instancesRouter.post("/:id/stop", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  try {
    await dockerSandbox.stopContainer(containerId);
    res.json({ success: true, containerId, status: "STOPPED" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to stop container";
    res.status(500).json({ success: false, containerId, error: message });
  }
});

instancesRouter.post("/:id/restart", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  try {
    await dockerSandbox.restartContainer(containerId);
    res.json({ success: true, containerId, status: "RUNNING" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to restart container";
    res.status(500).json({ success: false, containerId, error: message });
  }
});

instancesRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  try {
    await dockerSandbox.removeContainer(containerId);
    res.json({ success: true, containerId, status: "TERMINATED" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove container";
    res.status(500).json({ success: false, containerId, error: message });
  }
});

instancesRouter.get("/:id/logs", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  const tail = req.query.tail ? parseInt(req.query.tail as string, 10) : 100;
  try {
    const logs = await dockerSandbox.getLogs(containerId, isNaN(tail) ? 100 : tail);
    res.json({ success: true, containerId, logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch logs";
    res.status(500).json({ success: false, containerId, error: message });
  }
});
instancesRouter.get("/:id/stream", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  const tail = req.query.tail ? parseInt(req.query.tail as string, 10) : 50;

  try {
    const stream = await dockerSandbox.getLogsStream(containerId, isNaN(tail) ? 50 : tail);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: "connected", containerId })}\n\n`);

    stream.on("data", (chunk: Buffer) => {
      // Docker log frame contains 8-byte header: [stream_type, 0, 0, 0, size1, size2, size3, size4]
      let text = chunk.toString("utf-8");
      if (chunk.length > 8 && (chunk[0] === 1 || chunk[0] === 2)) {
        text = chunk.subarray(8).toString("utf-8");
      }
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          res.write(`data: ${JSON.stringify({ type: "log", line })}\n\n`);
        }
      }
    });

    stream.on("end", () => {
      res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
      res.end();
    });

    stream.on("error", (err: Error) => {
      res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
      res.end();
    });

    req.on("close", () => {
      const maybeStream: unknown = stream;
      if (
        maybeStream &&
        typeof maybeStream === "object" &&
        "destroy" in maybeStream &&
        typeof maybeStream.destroy === "function"
      ) {
        maybeStream.destroy();
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to open log stream";
    res.status(500).json({ success: false, containerId, error: message });
  }
});


instancesRouter.get("/:id/stats", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  try {
    const stats = await dockerSandbox.getStats(containerId);
    res.json({ success: true, containerId, stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    res.status(500).json({ success: false, containerId, error: message });
  }
});

// File Management Routes
instancesRouter.get("/:id/files", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  const dirPath = (req.query.path as string) || "/app";
  try {
    const files = await dockerSandbox.files.listFiles(containerId, dirPath);
    res.json({ success: true, containerId, path: dirPath, files });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list files";
    res.status(500).json({ success: false, containerId, error: message });
  }
});

instancesRouter.get("/:id/files/content", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  const filePath = req.query.path as string;
  if (!filePath) {
    res.status(400).json({ success: false, error: "Query parameter 'path' is required" });
    return;
  }
  try {
    const content = await dockerSandbox.files.readFile(containerId, filePath);
    res.json({ success: true, containerId, path: filePath, content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to read file";
    res.status(500).json({ success: false, containerId, error: message });
  }
});

instancesRouter.post("/:id/files/content", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  const { path: filePath, content } = req.body;
  if (!filePath || typeof content !== "string") {
    res.status(400).json({ success: false, error: "Body fields 'path' and 'content' are required" });
    return;
  }
  try {
    await dockerSandbox.files.writeFile(containerId, filePath, content);
    res.json({ success: true, containerId, path: filePath });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to write file";
    res.status(500).json({ success: false, containerId, error: message });
  }
});

instancesRouter.delete("/:id/files", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  const targetPath = req.query.path as string;
  if (!targetPath) {
    res.status(400).json({ success: false, error: "Query parameter 'path' is required" });
    return;
  }
  try {
    await dockerSandbox.files.deleteFile(containerId, targetPath);
    res.json({ success: true, containerId, path: targetPath });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete file";
    res.status(500).json({ success: false, containerId, error: message });
  }
});

instancesRouter.post("/:id/files/directory", async (req: Request, res: Response): Promise<void> => {
  const containerId = req.params.id;
  const { path: dirPath } = req.body;
  if (!dirPath) {
    res.status(400).json({ success: false, error: "Body field 'path' is required" });
    return;
  }
  try {
    await dockerSandbox.files.createDirectory(containerId, dirPath);
    res.json({ success: true, containerId, path: dirPath });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create directory";
    res.status(500).json({ success: false, containerId, error: message });
  }
});
