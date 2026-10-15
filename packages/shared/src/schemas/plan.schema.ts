import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(2).max(48).trim(),
  slug: z.string().min(2).max(48).regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
  description: z.string().min(4).max(256),
  priceMonthly: z.number().int().min(0),
  currency: z.string().length(3).default("IDR"),
  maxInstances: z.number().int().min(1).max(100).default(1),
  maxMemoryPerInstanceMb: z.number().int().min(128).max(4096).default(256),
  maxCpuPerInstance: z.number().min(0.1).max(2.0).default(0.5),
  maxStorageMb: z.number().int().min(128).max(10240).default(512),
  isActive: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
