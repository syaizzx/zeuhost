export * from "../schemas/auth.schema";
export * from "../schemas/bot.schema";
export * from "../schemas/branding.schema";
export * from "../schemas/plan.schema";
export * from "../constants";

export interface ContainerLifecycleResponse {
  success: boolean;
  instanceId: string;
  containerId?: string;
  status: string;
  error?: string;
}

export interface ContainerStats {
  memoryUsageMb: number;
  memoryLimitMb: number;
  cpuPercentage: number;
  pidsCount: number;
  uptimeSeconds: number;
}
