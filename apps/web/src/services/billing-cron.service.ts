import { prisma } from "@zeuhost/db";
import { runtimeClient } from "./runtime-client";

export interface LifecycleReport {
  timestamp: string;
  processedSubscriptions: number;
  pastDueMarked: number;
  instancesSuspended: number;
  instancesTerminated: number;
}

export class BillingCronService {
  async runSubscriptionLifecycleCheck(): Promise<LifecycleReport> {
    const now = new Date();
    const report: LifecycleReport = {
      timestamp: now.toISOString(),
      processedSubscriptions: 0,
      pastDueMarked: 0,
      instancesSuspended: 0,
      instancesTerminated: 0,
    };

    // 1. Process ACTIVE subscriptions where period has ended -> PAST_DUE (H+0)
    const expiredActive = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: { lt: now },
      },
    });

    for (const sub of expiredActive) {
      report.processedSubscriptions++;
      // Set grace period to 3 days from now
      const gracePeriodEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "PAST_DUE",
          gracePeriodEnd,
        },
      });
      report.pastDueMarked++;
    }

    // 2. Process PAST_DUE subscriptions where grace period ended -> SUSPENDED (H+3)
    const gracePeriodExpired = await prisma.subscription.findMany({
      where: {
        status: "PAST_DUE",
        gracePeriodEnd: { lt: now },
      },
      include: {
        customer: {
          include: {
            instances: {
              where: { status: "RUNNING" },
            },
          },
        },
      },
    });

    for (const sub of gracePeriodExpired) {
      report.processedSubscriptions++;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "SUSPENDED" },
      });

      // Stop running bot containers for this customer
      for (const inst of sub.customer.instances) {
        if (inst.containerId) {
          try {
            await runtimeClient.stopContainer(inst.containerId);
          } catch {
            // Container might already be stopped
          }
        }
        await prisma.botInstance.update({
          where: { id: inst.id },
          data: {
            status: "STOPPED",
            failureReason: "Suspended: Masa aktif langganan telah habis (Lewat jatuh tempo 3 hari).",
            lastStoppedAt: now,
          },
        });
        report.instancesSuspended++;
      }
    }

    // 3. Process SUSPENDED subscriptions over 7 days -> TERMINATED (H+7)
    const sevenDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 3 days grace + 4 days suspended = 7 days
    const terminatedCandidates = await prisma.subscription.findMany({
      where: {
        status: "SUSPENDED",
        updatedAt: { lt: sevenDaysAgo },
      },
      include: {
        customer: {
          include: {
            instances: {
              where: { status: { not: "TERMINATED" } },
            },
          },
        },
      },
    });

    for (const sub of terminatedCandidates) {
      report.processedSubscriptions++;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "CANCELLED" },
      });

      // Remove bot containers and mark TERMINATED
      for (const inst of sub.customer.instances) {
        if (inst.containerId) {
          try {
            await runtimeClient.removeContainer(inst.containerId);
          } catch {
            // Already removed
          }
        }
        await prisma.botInstance.update({
          where: { id: inst.id },
          data: {
            status: "TERMINATED",
            failureReason: "Terminated: Akun dibatalkan karena tagihan diabaikan lebih dari 7 hari.",
            lastStoppedAt: now,
          },
        });
        report.instancesTerminated++;
      }
    }

    return report;
  }
}

export const billingCronService = new BillingCronService();
