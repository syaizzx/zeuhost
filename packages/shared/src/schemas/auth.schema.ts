import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid").toLowerCase().trim(),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(64).trim(),
  email: z.string().email("Format email tidak valid").toLowerCase().trim(),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const createOwnerSchema = z.object({
  name: z.string().min(2).max(64).trim().default("Platform Operator"),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(12, "Password operator minimal 12 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateOwnerInput = z.infer<typeof createOwnerSchema>;
