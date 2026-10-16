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

export function enrichPlan(plan: {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  maxInstances: number;
  maxMemoryPerInstanceMb: number;
  maxCpuPerInstance: number;
  maxStorageMb: number;
  isActive: boolean;
}): PlanItem {
  const isWebNode = plan.slug.includes("web") || plan.slug.includes("node");
  const isPython = plan.slug.includes("python");
  const category: PlanItem["category"] = isWebNode ? "WEB_NODEJS" : isPython ? "PYTHON_APP" : "BOT_HOSTING";
  const hasFileManager = isWebNode || isPython;

  return {
    ...plan,
    category,
    hasFileManager,
  };
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
      return plans.length > 0 ? plans.map(enrichPlan) : DEFAULT_PLANS;
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

      if (!subscription || !subscription.plan) return null;

      return {
        ...subscription,
        plan: enrichPlan(subscription.plan),
      };
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

      if (!subscription || !subscription.plan) {
        return {
          allowed: false,
          reason: "Anda belum memiliki paket hosting aktif. Silakan pilih dan aktifkan paket terlebih dahulu di /buy.",
          maxMemoryMb: 0,
          maxCpuCores: 0,
          hasFileManager: false,
          category: "NONE",
        };
      }

      const plan = enrichPlan(subscription.plan);
      const maxInstances = plan.maxInstances ?? 1;
      const maxMemoryMb = plan.maxMemoryPerInstanceMb ?? 256;
      const maxCpuCores = plan.maxCpuPerInstance ?? 0.5;
      const hasFileManager = plan.hasFileManager;
      const category = plan.category;

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
