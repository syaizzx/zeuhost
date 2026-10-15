import { prisma } from "@zeuhost/db";

const DEFAULT_PLANS = [
  {
    id: "plan-starter",
    slug: "plan-starter",
    name: "Starter Trial",
    description: "Uji coba performa dan stabilitas bot gratis tanpa kartu kredit.",
    priceMonthly: 0,
    currency: "IDR",
    maxInstances: 1,
    maxMemoryPerInstanceMb: 256,
    maxCpuPerInstance: 0.5,
    maxStorageMb: 512,
    isActive: true,
  },
  {
    id: "plan-pro",
    slug: "plan-pro",
    name: "Pro Jadibot",
    description: "Paling pas untuk toko online, bot grup aktif, dan server komunitas.",
    priceMonthly: 25000,
    currency: "IDR",
    maxInstances: 3,
    maxMemoryPerInstanceMb: 512,
    maxCpuPerInstance: 0.5,
    maxStorageMb: 1024,
    isActive: true,
  },
  {
    id: "plan-reseller",
    slug: "plan-reseller",
    name: "Operator Reseller",
    description: "Untuk reseller atau komunitas besar yang ingin mengelola banyak bot.",
    priceMonthly: 75000,
    currency: "IDR",
    maxInstances: 10,
    maxMemoryPerInstanceMb: 2048,
    maxCpuPerInstance: 1.0,
    maxStorageMb: 4096,
    isActive: true,
  },
];

export class PlanService {
  async getActivePlans() {
    try {
      const plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { priceMonthly: "asc" },
      });
      return plans.length > 0 ? plans : DEFAULT_PLANS;
    } catch {
      return DEFAULT_PLANS;
    }
  }

  async checkCustomerQuota(customerId: string): Promise<{
    allowed: boolean;
    reason?: string;
    maxMemoryMb: number;
    maxCpuCores: number;
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

      const maxInstances = subscription?.plan?.maxInstances ?? 1;
      const maxMemoryMb = subscription?.plan?.maxMemoryPerInstanceMb ?? 256;
      const maxCpuCores = subscription?.plan?.maxCpuPerInstance ?? 0.5;

      const activeInstanceCount = await prisma.botInstance.count({
        where: {
          customerId,
          status: { not: "TERMINATED" },
        },
      });

      if (activeInstanceCount >= maxInstances) {
        return {
          allowed: false,
          reason: `Batas kuota tercapai (${activeInstanceCount}/${maxInstances} bot). Silakan upgrade paket untuk menambah bot.`,
          maxMemoryMb,
          maxCpuCores,
        };
      }

      return {
        allowed: true,
        maxMemoryMb,
        maxCpuCores,
      };
    } catch {
      return {
        allowed: true,
        maxMemoryMb: 256,
        maxCpuCores: 0.5,
      };
    }
  }
}

export const planService = new PlanService();
