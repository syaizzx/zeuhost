import { prisma, PaymentMethod } from "@zeuhost/db";
import { getPaymentDriver, getActivePaymentProvider, TransactionResult } from "./payment-gateway";
import { runtimeClient } from "./runtime-client";

export interface SubmitPaymentInput {
  planId: string;
  amount: number;
  currency?: string;
  method?: "MANUAL_TRANSFER" | "STRIPE" | "CRYPTO" | "EXTERNAL";
  providerReference?: string;
  proofDocumentUrl?: string;
}

export class PaymentService {
  async getCustomerPayments(customerId: string) {
    try {
      return await prisma.paymentRecord.findMany({
        where: { customerId },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      return [];
    }
  }

  async getPendingPayments() {
    try {
      return await prisma.paymentRecord.findMany({
        where: { status: "PENDING" },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          subscription: { include: { plan: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      return [];
    }
  }

  async getPaymentConfig() {
    const provider = getActivePaymentProvider();
    return {
      provider,
      manual: {
        bankName: process.env.MANUAL_BANK_NAME || "BCA",
        accountNumber: process.env.MANUAL_ACCOUNT_NUMBER || "8420198888",
        accountName: process.env.MANUAL_ACCOUNT_NAME || "ZeuHost Operator",
      },
    };
  }

  async initiateCheckout(customerId: string, planId: string): Promise<TransactionResult & { paymentRecordId?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: customerId },
    });
    if (!user) throw new Error("Customer not found");

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new Error("Plan not found");

    const driver = getPaymentDriver();
    const result = await driver.createTransaction({
      customerId: user.id,
      customerEmail: user.email,
      customerName: user.name,
      planId: plan.id,
      planName: plan.name,
      amount: plan.priceMonthly,
      currency: plan.currency,
    });

    // Ensure subscription record exists
    let subscription = await prisma.subscription.findFirst({
      where: { customerId, planId },
    });

    if (!subscription) {
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      subscription = await prisma.subscription.create({
        data: {
          customerId,
          planId,
          status: "PAST_DUE",
          currentPeriodEnd: periodEnd,
        },
      });
    }

    // Create pending payment record
    const record = await prisma.paymentRecord.create({
      data: {
        customerId,
        subscriptionId: subscription.id,
        amount: plan.priceMonthly,
        currency: plan.currency,
        method: result.method,
        providerReference: result.reference,
        status: "PENDING",
      },
    });

    return {
      ...result,
      paymentRecordId: record.id,
    };
  }

  async createPaymentSubmission(customerId: string, input: SubmitPaymentInput) {
    const plan = await prisma.plan.findFirst({
      where: {
        OR: [{ id: input.planId }, { slug: input.planId }],
      },
    });

    let subscriptionId: string | undefined = undefined;

    if (plan) {
      let subscription = await prisma.subscription.findFirst({
        where: { customerId, planId: plan.id },
      });

      if (!subscription) {
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        subscription = await prisma.subscription.create({
          data: {
            customerId,
            planId: plan.id,
            status: "PAST_DUE",
            currentPeriodEnd: periodEnd,
          },
        });
      }
      subscriptionId = subscription.id;
    }

    const ref = input.providerReference && input.providerReference.trim()
      ? input.providerReference.trim()
      : `REF-${Date.now().toString().slice(-6)}`;

    return await prisma.paymentRecord.create({
      data: {
        customerId,
        subscriptionId,
        amount: input.amount,
        currency: input.currency || "IDR",
        method: (input.method as PaymentMethod) || "MANUAL_TRANSFER",
        providerReference: ref,
        proofDocumentUrl: input.proofDocumentUrl,
        status: "PENDING",
      },
    });
  }

  async handlePaymentSuccess(providerReference: string, metadata?: Record<string, unknown>) {
    const payment = await prisma.paymentRecord.findFirst({
      where: { providerReference },
      include: { subscription: true, customer: true },
    });

    if (!payment) {
      console.warn(`[PaymentService] No payment record found for reference: ${providerReference}`);
      return null;
    }

    // Idempotency: skip if already confirmed
    if (payment.status === "CONFIRMED") {
      return payment;
    }

    const updatedPayment = await prisma.paymentRecord.update({
      where: { id: payment.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        operatorNotes: metadata ? JSON.stringify(metadata) : "Confirmed automatically via payment gateway webhook",
      },
    });

    // Extend Subscription by 30 days
    if (payment.subscriptionId) {
      const now = new Date();
      const currentEnd = payment.subscription?.currentPeriodEnd || now;
      const baseDate = currentEnd > now ? currentEnd : now;
      const newPeriodEnd = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: "ACTIVE",
          currentPeriodEnd: newPeriodEnd,
          gracePeriodEnd: null,
        },
      });

      // Resume suspended instances for this customer
      const instances = await prisma.botInstance.findMany({
        where: { customerId: payment.customerId, status: "STOPPED" },
      });

      for (const inst of instances) {
        if (inst.containerId) {
          try {
            await runtimeClient.startContainer(inst.containerId);
            await prisma.botInstance.update({
              where: { id: inst.id },
              data: { status: "RUNNING", lastStartedAt: new Date() },
            });
          } catch {
            // Container restart failure non-fatal to webhook
          }
        }
      }
    }

    return updatedPayment;
  }

  async confirmPayment(staffId: string, paymentId: string, operatorNotes?: string) {
    const payment = await prisma.paymentRecord.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });

    if (!payment) throw new Error("Payment record not found");
    if (payment.status === "CONFIRMED") return payment;

    const updatedPayment = await prisma.paymentRecord.update({
      where: { id: paymentId },
      data: {
        status: "CONFIRMED",
        confirmedByStaffId: staffId,
        confirmedAt: new Date(),
        operatorNotes: operatorNotes || "Confirmed by operator",
      },
    });

    if (payment.subscriptionId) {
      const now = new Date();
      const newPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: "ACTIVE",
          currentPeriodEnd: newPeriodEnd,
          gracePeriodEnd: null,
        },
      });

      // Resume instances
      const instances = await prisma.botInstance.findMany({
        where: { customerId: payment.customerId, status: "STOPPED" },
      });

      for (const inst of instances) {
        if (inst.containerId) {
          try {
            await runtimeClient.startContainer(inst.containerId);
            await prisma.botInstance.update({
              where: { id: inst.id },
              data: { status: "RUNNING", lastStartedAt: new Date() },
            });
          } catch {
            // Ignore if container is already running
          }
        }
      }
    }

    return updatedPayment;
  }

  async rejectPayment(staffId: string, paymentId: string, operatorNotes?: string) {
    const payment = await prisma.paymentRecord.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new Error("Payment record not found");

    return await prisma.paymentRecord.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        confirmedByStaffId: staffId,
        confirmedAt: new Date(),
        operatorNotes: operatorNotes || "Rejected by operator",
      },
    });
  }
}

export const paymentService = new PaymentService();
