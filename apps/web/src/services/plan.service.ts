import { prisma } from "@zeuhost/db";

export interface PlanItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "BOT_HOSTING" | "WEB_NODEJS" | "PYTHON_APP";
  hasFileManager: boolean;
  priceMonthly: number;
  currency: string;
  maxInstances: number;
  maxMemoryPerInstanceMb: number;
  maxCpuPerInstance: number;
  maxStorageMb: number;
  isActive: boolean;
}

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: "plan-bot-starter",
    slug: "plan-bot-starter",
    name: "Bot Jadibot Starter",
    description: "Hosting bot WhatsApp/Discord otomatis tanpa koding. Kode bot tertanam paten, kontrol via Live Terminal & Pairing Code.",
    category: "BOT_HOSTING",
    hasFileManager: false,
    priceMonthly: 15000,
    currency: "IDR",
    maxInstances: 1,
    maxMemoryPerInstanceMb: 256,
    maxCpuPerInstance: 0.5,
    maxStorageMb: 512,
    isActive: true,
  },
  {
    id: "plan-bot-pro",
    slug: "plan-bot-pro",
    name: "Pro Jadibot WhatsApp & Discord",
    description: "Dukungan multi-bot aktif 24 jam dengan auto-reconnect, QR scanner, & 8-digit pairing code.",
    category: "BOT_HOSTING",
    hasFileManager: false,
    priceMonthly: 25000,
    currency: "IDR",
    maxInstances: 3,
    maxMemoryPerInstanceMb: 512,
    maxCpuPerInstance: 0.5,
    maxStorageMb: 1024,
    isActive: true,
  },
  {
    id: "plan-web-nodejs",
    slug: "plan-web-nodejs",
    name: "Node.js & Web PaaS Hosting",
    description: "Jalankan backend Express, Next.js, API, atau bot kustom dengan In-Browser File Manager, Monaco Editor, & custom port.",
    category: "WEB_NODEJS",
    hasFileManager: true,
    priceMonthly: 45000,
    currency: "IDR",
    maxInstances: 5,
    maxMemoryPerInstanceMb: 1024,
    maxCpuPerInstance: 1.0,
    maxStorageMb: 2048,
    isActive: true,
  },
  {
    id: "plan-python-app",
    slug: "plan-python-app",
    name: "Python Cloud & Custom App",
    description: "Cloud hosting Python (FastAPI, Flask, Pyrogram) dengan akses Web File Manager langsung dan Live Terminal.",
    category: "PYTHON_APP",
    hasFileManager: true,
    priceMonthly: 50000,
    currency: "IDR",
    maxInstances: 5,
    maxMemoryPerInstanceMb: 1024,
    maxCpuPerInstance: 1.0,
    maxStorageMb: 2048,
    isActive: true,
  },
];

export class PlanService {
  async getActivePlans(): Promise<PlanItem[]> {
    try {
      const plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { priceMonthly: "asc" },
      });
      return plans.length > 0 ? (plans as unknown as PlanItem[]) : DEFAULT_PLANS;
    } catch {
      return DEFAULT_PLANS;
    }
  }

  async getCustomerActiveSubscription(customerId: string) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          customerId,
          status: { in: ["ACTIVE", "GRACE_PERIOD"] },
        },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });

      return subscription;
    } catch {
      return null;
    }
  }

  async checkCustomerQuota(customerId: string): Promise<{
    allowed: boolean;
    reason?: string;
    maxMemoryMb: number;
    maxCpuCores: number;
    hasFileManager: boolean;
    category: string;
  }> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          customerId,
          status: { in: ["ACTIVE", "GRACE_PERIOD"] },
        },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });

      if (!subscription) {
        return {
          allowed: false,
          reason: "Anda belum memiliki paket hosting aktif. Silakan pilih dan aktifkan paket terlebih dahulu.",
          maxMemoryMb: 0,
          maxCpuCores: 0,
          hasFileManager: false,
          category: "NONE",
        };
      }

      const plan = subscription.plan;
      const maxInstances = plan?.maxInstances ?? 1;
      const maxMemoryMb = plan?.maxMemoryPerInstanceMb ?? 256;
      const maxCpuCores = plan?.maxCpuPerInstance ?? 0.5;
      const hasFileManager = (plan as unknown as { hasFileManager?: boolean })?.hasFileManager ?? false;
      const category = (plan as unknown as { category?: string })?.category ?? "BOT_HOSTING";

      const activeInstanceCount = await prisma.botInstance.count({
        where: {
          customerId,
          status: { not: "TERMINATED" },
        },
      });

      if (activeInstanceCount >= maxInstances) {
        return {
          allowed: false,
          reason: `Batas kuota instance tercapai (${activeInstanceCount}/${maxInstances}). Silakan upgrade paket untuk menambah instance.`,
          maxMemoryMb,
          maxCpuCores,
          hasFileManager,
          category,
        };
      }

      return {
        allowed: true,
        maxMemoryMb,
        maxCpuCores,
        hasFileManager,
        category,
      };
    } catch {
      return {
        allowed: false,
        reason: "Gagal memverifikasi status paket langganan.",
        maxMemoryMb: 0,
        maxCpuCores: 0,
        hasFileManager: false,
        category: "NONE",
      };
    }
  }
}

export const planService = new PlanService();
