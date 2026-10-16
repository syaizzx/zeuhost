import Docker from "dockerode";
import { ContainerFileManager } from "./files";
export interface SpawnParams {
  instanceId: string;
  image: string;
  env: Record<string, string>;
  memoryMb: number;
  cpuCores: number;
}

export class DockerSandboxClient {
  readonly docker: Docker;
  readonly files: ContainerFileManager;
  constructor() {
    this.docker = new Docker({
      socketPath: process.env.DOCKER_SOCKET_PATH || "/var/run/docker.sock",
    });
    this.files = new ContainerFileManager(this.docker);
  }

  async ping(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  async createHardenedContainer(params: SpawnParams): Promise<string> {
    const envArray = Object.entries(params.env).map(([k, v]) => `${k}=${v}`);
    const containerName = `zeuhost-bot-${params.instanceId}`;

    const container = await this.docker.createContainer({
      name: containerName,
      Image: params.image,
      User: "1001:1001", // Hardened non-root user (zeubot:zeubot)
      Env: envArray,
      AttachStdout: true,
      AttachStderr: true,
      HostConfig: {
        CapDrop: ["ALL"], // Drop all Linux capabilities
        SecurityOpt: ["no-new-privileges:true"],
        Memory: params.memoryMb * 1024 * 1024,
        MemorySwap: params.memoryMb * 1024 * 1024, // Disables excess swap
        NanoCpus: Math.floor(params.cpuCores * 1e9),
        PidsLimit: 100, // Fork bomb mitigation
        ReadonlyRootfs: true,
        Tmpfs: {
          "/tmp": "rw,noexec,nosuid,size=64m",
        },
        Binds: [`zeuhost-data-${params.instanceId}:/app/data:rw`],
        NetworkMode: "zeuhost-bots",
        RestartPolicy: {
          Name: "on-failure",
          MaximumRetryCount: 5,
        },
      },
      Labels: {
        "org.zeuhost.managed": "true",
        "org.zeuhost.instanceId": params.instanceId,
      },
    });

    return container.id;
  }

  async startContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.start();
  }

  async stopContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    // 10 second graceful shutdown before SIGKILL
    await container.stop({ t: 10 });
  }

  async restartContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.restart({ t: 5 });
  }

  async removeContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.remove({ force: true, v: true });
  }

  async getLogs(containerId: string, tail = 100): Promise<string> {
    const container = this.docker.getContainer(containerId);
    const logsBuffer = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });
    return logsBuffer.toString("utf-8");
  }
  async getLogsStream(containerId: string, tail = 50): Promise<NodeJS.ReadableStream> {
    const container = this.docker.getContainer(containerId);
    const stream = (await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    })) as unknown as NodeJS.ReadableStream;
    return stream;
  }

  async getStats(containerId: string): Promise<{
    memoryUsageMb: number;
    memoryLimitMb: number;
    cpuPercentage: number;
    pidsCount: number;
  }> {
    const container = this.docker.getContainer(containerId);
    const stats = (await container.stats({ stream: false })) as unknown as {
      memory_stats: { usage?: number; limit?: number };
      cpu_stats: { cpu_usage?: { total_usage?: number }; system_cpu_usage?: number };
      precpu_stats: { cpu_usage?: { total_usage?: number }; system_cpu_usage?: number };
      pids_stats: { current?: number };
    };

    const memUsage = stats.memory_stats?.usage ?? 0;
    const memLimit = stats.memory_stats?.limit ?? 1;

    // Calculate CPU delta percentage
    const cpuDelta = (stats.cpu_stats?.cpu_usage?.total_usage ?? 0) - (stats.precpu_stats?.cpu_usage?.total_usage ?? 0);
    const systemDelta = (stats.cpu_stats?.system_cpu_usage ?? 0) - (stats.precpu_stats?.system_cpu_usage ?? 0);
    let cpuPercentage = 0;
    if (systemDelta > 0 && cpuDelta > 0) {
      cpuPercentage = parseFloat(((cpuDelta / systemDelta) * 100).toFixed(2));
    }

    return {
      memoryUsageMb: Math.round(memUsage / (1024 * 1024)),
      memoryLimitMb: Math.round(memLimit / (1024 * 1024)),
      cpuPercentage,
      pidsCount: stats.pids_stats?.current ?? 0,
    };
  }
}

export const dockerSandbox = new DockerSandboxClient();
