import { prisma } from "@zeuhost/db";
import { CreateBotInstanceInput } from "@zeuhost/shared";
import { encryptPayload, decryptPayload } from "../lib/encryption";
import { runtimeClient } from "./runtime-client";
import { planService } from "./plan.service";

export class BotService {
  async getCustomerInstances(customerId: string) {
    return prisma.botInstance.findMany({
      where: {
        customerId,
        status: { not: "TERMINATED" },
      },
      include: {
        templateVersion: {
          include: { template: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCustomerInstance(customerId: string, instanceId: string) {
    const instance = await prisma.botInstance.findFirst({
      where: {
        id: instanceId,
        customerId, // Strict tenant scoping
      },
      include: {
        templateVersion: {
          include: { template: true },
        },
      },
    });

    if (!instance) {
      throw new Error("Instance not found or access denied");
    }

    return instance;
  }

  async createInstance(customerId: string, input: CreateBotInstanceInput) {
    // 1. Enforce Quota
    const quota = await planService.checkCustomerQuota(customerId);
    if (!quota.allowed) {
      throw new Error(quota.reason || "Quota exceeded");
    }

    // 2. Fetch template version
    const templateVersion = await prisma.botTemplateVersion.findUnique({
      where: { id: input.templateVersionId },
    });

    if (!templateVersion) {
      throw new Error("Invalid template version specified");
    }

    // 3. Encrypt environment variables
    const encryptedEnv = encryptPayload(JSON.stringify(input.envVars));

    // 4. Create database record
    const instance = await prisma.botInstance.create({
      data: {
        customerId,
        templateVersionId: input.templateVersionId,
        name: input.name,
        encryptedEnvVars: encryptedEnv,
        memoryLimitMb: quota.maxMemoryMb,
        cpuLimitCores: quota.maxCpuCores,
        status: "STOPPED",
      },
    });

    // 5. Spawn Docker container via Runtime Manager
    try {
      const spawnResult = await runtimeClient.spawnContainer({
        instanceId: instance.id,
        image: templateVersion.dockerImage,
        env: input.envVars,
        memoryMb: quota.maxMemoryMb,
        cpuCores: quota.maxCpuCores,
      });

      return await prisma.botInstance.update({
        where: { id: instance.id },
        data: {
          containerId: spawnResult.containerId,
          status: "RUNNING",
          lastStartedAt: new Date(),
        },
      });
    } catch (spawnError: unknown) {
      const message = spawnError instanceof Error ? spawnError.message : "Failed to spawn container";
      await prisma.botInstance.update({
        where: { id: instance.id },
        data: {
          status: "FAILED",
          failureReason: message,
        },
      });
      throw spawnError;
    }
  }

  async performAction(customerId: string, instanceId: string, action: "START" | "STOP" | "RESTART") {
    const instance = await this.getCustomerInstance(customerId, instanceId);

    if (!instance.containerId) {
      throw new Error("Instance has no associated container ID");
    }

    if (action === "START") {
      await runtimeClient.startContainer(instance.containerId);
      return prisma.botInstance.update({
        where: { id: instanceId },
        data: { status: "RUNNING", lastStartedAt: new Date() },
      });
    }

    if (action === "STOP") {
      await runtimeClient.stopContainer(instance.containerId);
      return prisma.botInstance.update({
        where: { id: instanceId },
        data: { status: "STOPPED", lastStoppedAt: new Date() },
      });
    }

    if (action === "RESTART") {
      await runtimeClient.restartContainer(instance.containerId);
      return prisma.botInstance.update({
        where: { id: instanceId },
        data: { status: "RUNNING", lastStartedAt: new Date() },
      });
    }

    throw new Error(`Unsupported action: ${action}`);
  }

  async getLogs(customerId: string, instanceId: string, tail = 100) {
    const instance = await this.getCustomerInstance(customerId, instanceId);
    if (!instance.containerId) {
      return "No active container for this bot instance.";
    }
    return runtimeClient.getLogs(instance.containerId, tail);
  }
  async getLogsStream(customerId: string, instanceId: string, tail = 50) {
    const instance = await this.getCustomerInstance(customerId, instanceId);
    if (!instance.containerId) {
      throw new Error("No active container for this bot instance.");
    }
    return runtimeClient.getLogsStream(instance.containerId, tail);
  }


  async getStats(customerId: string, instanceId: string) {
    const instance = await this.getCustomerInstance(customerId, instanceId);
    if (!instance.containerId || instance.status !== "RUNNING") {
      return {
        memoryUsageMb: 0,
        memoryLimitMb: instance.memoryLimitMb,
        cpuPercentage: 0,
        pidsCount: 0,
      };
    }
    return runtimeClient.getStats(instance.containerId);
  }

  async deleteInstance(customerId: string, instanceId: string) {
    const instance = await this.getCustomerInstance(customerId, instanceId);

    if (instance.containerId) {
      try {
        await runtimeClient.removeContainer(instance.containerId);
      } catch {
        // Continue database deletion even if container was already pruned
      }
    }

    return prisma.botInstance.update({
      where: { id: instanceId },
      data: {
        status: "TERMINATED",
        lastStoppedAt: new Date(),
      },
    });
  }

  async listFiles(customerId: string, instanceId: string, dirPath = "/app") {
    const instance = await this.getCustomerInstance(customerId, instanceId);
    if (!instance.containerId || instance.status !== "RUNNING") {
      throw new Error("Bot container is not running.");
    }
    return runtimeClient.listFiles(instance.containerId, dirPath);
  }

  async readFile(customerId: string, instanceId: string, filePath: string) {
    const instance = await this.getCustomerInstance(customerId, instanceId);
    if (!instance.containerId || instance.status !== "RUNNING") {
      throw new Error("Bot container is not running.");
    }
    return runtimeClient.readFile(instance.containerId, filePath);
  }

  async writeFile(customerId: string, instanceId: string, filePath: string, content: string) {
    const instance = await this.getCustomerInstance(customerId, instanceId);
    if (!instance.containerId || instance.status !== "RUNNING") {
      throw new Error("Bot container is not running.");
    }
    return runtimeClient.writeFile(instance.containerId, filePath, content);
  }

  async deleteFile(customerId: string, instanceId: string, targetPath: string) {
    const instance = await this.getCustomerInstance(customerId, instanceId);
    if (!instance.containerId || instance.status !== "RUNNING") {
      throw new Error("Bot container is not running.");
    }
    return runtimeClient.deleteFile(instance.containerId, targetPath);
  }

  async createDirectory(customerId: string, instanceId: string, dirPath: string) {
    const instance = await this.getCustomerInstance(customerId, instanceId);
    if (!instance.containerId || instance.status !== "RUNNING") {
      throw new Error("Bot container is not running.");
    }
    return runtimeClient.createDirectory(instance.containerId, dirPath);
  }
}

export const botService = new BotService();
