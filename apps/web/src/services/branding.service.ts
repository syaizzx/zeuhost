import { prisma } from "@zeuhost/db";
import { UpdateBrandingInput } from "@zeuhost/shared";

const DEFAULT_BRANDING = {
  productName: "ZeuHost",
  companyName: "Zeuzz",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#09090B",
  accentColor: "#10B981",
  supportEmail: "support@zeuhost.org",
  footerText: "Layanan Hosting Bot WhatsApp dan Discord",
  landingHeadline: "Sewa dan jalankan bot kamu 24 jam tanpa perlu menyalakan laptop.",
  landingSubheadline: "ZeuHost menyediakan hosting bot untuk WhatsApp, Discord, dan Telegram. Cukup hubungkan sekali dari browser, bot kamu langsung aktif melayani chat pelanggan atau komunitas.",
};

export class BrandingService {
  async getBranding() {
    try {
      const setting = await prisma.brandingSetting.findUnique({
        where: { id: "branding_config" },
      });
      return setting || DEFAULT_BRANDING;
    } catch {
      return DEFAULT_BRANDING;
    }
  }

  async updateBranding(data: UpdateBrandingInput) {
    try {
      return await prisma.brandingSetting.upsert({
        where: { id: "branding_config" },
        update: { ...data },
        create: {
          id: "branding_config",
          ...data,
        },
      });
    } catch {
      return {
        id: "branding_config",
        ...DEFAULT_BRANDING,
        ...data,
      };
    }
  }
}

export const brandingService = new BrandingService();
