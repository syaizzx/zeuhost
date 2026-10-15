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
