import Docker from "dockerode";
import path from "path";

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  permissions: string;
}

export class ContainerFileManager {
  private docker: Docker;

  constructor(docker: Docker) {
    this.docker = docker;
  }

  private sanitizePath(targetPath: string): string {
    const normalized = path.posix.normalize(targetPath);
    if (normalized.includes("..") || normalized.startsWith("/etc") || normalized.startsWith("/root") || normalized.startsWith("/proc") || normalized.startsWith("/sys")) {
      throw new Error("Access denied: Path outside allowed workspace.");
    }
    // Default workspace is /app
    if (!normalized.startsWith("/app")) {
      return path.posix.join("/app", normalized);
    }
    return normalized;
  }

  private async execCommand(containerId: string, cmd: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const container = this.docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      User: "1001:1001",
    });

    const stream = await exec.start({ Detach: false });
    const { promise, resolve, reject } = Promise.withResolvers<{ stdout: string; stderr: string; exitCode: number }>();
    let stdout = "";
    let stderr = "";

    stream.on("data", (chunk: Buffer) => {
      if (chunk.length > 8 && (chunk[0] === 1 || chunk[0] === 2)) {
        const text = chunk.subarray(8).toString("utf-8");
        if (chunk[0] === 1) stdout += text;
        else stderr += text;
      } else {
        stdout += chunk.toString("utf-8");
      }
    });

    stream.on("end", async () => {
      try {
        const inspect = await exec.inspect();
        resolve({ stdout, stderr, exitCode: inspect.ExitCode ?? 0 });
      } catch {
        resolve({ stdout, stderr, exitCode: 0 });
      }
    });

    stream.on("error", reject);
    return promise;
  }

  async listFiles(containerId: string, dirPath = "/app"): Promise<FileItem[]> {
    const safePath = this.sanitizePath(dirPath);
    // Use ls with tab delimiter: type, size, name
    const cmd = ["sh", "-c", `ls -la --time-style=+%s "${safePath}" 2>/dev/null || ls -la "${safePath}"`];
    const { stdout, exitCode } = await this.execCommand(containerId, cmd);

    if (exitCode !== 0 && !stdout) {
      return [];
    }

    const lines = stdout.split("\n").filter((l) => l.trim() && !l.startsWith("total"));
    const items: FileItem[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 8) continue;
      const permissions = parts[0];
      const isDirectory = permissions.startsWith("d");
      const sizeBytes = parseInt(parts[4], 10) || 0;
      const name = parts.slice(parts.length >= 9 ? 8 : 7).join(" ");

      if (name === "." || name === "..") continue;

      items.push({
        name,
        path: path.posix.join(safePath, name),
        isDirectory,
        sizeBytes,
        permissions,
      });
    }

    return items;
  }

  async readFile(containerId: string, filePath: string): Promise<string> {
    const safePath = this.sanitizePath(filePath);
    const cmd = ["cat", safePath];
    const { stdout, stderr, exitCode } = await this.execCommand(containerId, cmd);

    if (exitCode !== 0) {
      throw new Error(stderr || `Failed to read file ${safePath}`);
    }

    return stdout;
  }

  async writeFile(containerId: string, filePath: string, content: string): Promise<boolean> {
    const safePath = this.sanitizePath(filePath);
    // Base64 encode content to prevent shell injection or escaping issues
    const b64 = Buffer.from(content, "utf-8").toString("base64");
    const cmd = ["sh", "-c", `echo "${b64}" | base64 -d > "${safePath}"`];
    const { stderr, exitCode } = await this.execCommand(containerId, cmd);

    if (exitCode !== 0) {
      throw new Error(stderr || `Failed to write file ${safePath}`);
    }

    return true;
  }

  async deleteFile(containerId: string, targetPath: string): Promise<boolean> {
    const safePath = this.sanitizePath(targetPath);
    if (safePath === "/app" || safePath === "/app/data") {
      throw new Error("Cannot delete root workspace directory.");
    }
    const cmd = ["rm", "-rf", safePath];
    const { stderr, exitCode } = await this.execCommand(containerId, cmd);

    if (exitCode !== 0) {
      throw new Error(stderr || `Failed to delete ${safePath}`);
    }

    return true;
  }

  async createDirectory(containerId: string, dirPath: string): Promise<boolean> {
    const safePath = this.sanitizePath(dirPath);
    const cmd = ["mkdir", "-p", safePath];
    const { stderr, exitCode } = await this.execCommand(containerId, cmd);

    if (exitCode !== 0) {
      throw new Error(stderr || `Failed to create directory ${safePath}`);
    }

    return true;
  }
}
