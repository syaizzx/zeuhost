import { z } from "zod";

const hexColorRegex = /^#([0-9a-fA-F]{3}){1,2}$/;

export const updateBrandingSchema = z.object({
  productName: z.string().min(2, "Nama produk minimal 2 karakter").max(32).trim(),
  companyName: z.string().min(2).max(64).trim(),
  logoUrl: z.string().url("URL logo tidak valid").nullable().optional(),
  faviconUrl: z.string().url("URL favicon tidak valid").nullable().optional(),
  primaryColor: z.string().regex(hexColorRegex, "Format hex color tidak valid (contoh: #0f172a)").default("#0f172a"),
  accentColor: z.string().regex(hexColorRegex, "Format hex color tidak valid (contoh: #10b981)").default("#10b981"),
  supportEmail: z.string().email("Email bantuan tidak valid").nullable().optional(),
  footerText: z.string().max(128).nullable().optional(),
  landingHeadline: z.string().min(4).max(120),
  landingSubheadline: z.string().min(4).max(240),
});

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
