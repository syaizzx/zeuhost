import { z } from "zod";

export const createBotInstanceSchema = z.object({
  name: z.string().min(2, "Nama bot minimal 2 karakter").max(48, "Nama bot maksimal 48 karakter").trim(),
  templateVersionId: z.string().min(1, "Template wajib dipilih"),
  envVars: z.record(z.string().min(1), z.string()).default({}),
});

export const updateBotInstanceSchema = z.object({
  name: z.string().min(2).max(48).trim().optional(),
  envVars: z.record(z.string().min(1), z.string()).optional(),
});

export const botActionSchema = z.object({
  action: z.enum(["START", "STOP", "RESTART"]),
});

export type CreateBotInstanceInput = z.infer<typeof createBotInstanceSchema>;
export type UpdateBotInstanceInput = z.infer<typeof updateBotInstanceSchema>;
export type BotActionInput = z.infer<typeof botActionSchema>;
