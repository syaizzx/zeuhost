import { prisma, PaymentMethod } from "@zeuhost/db";

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
          customer: {
            select: { id: true, name: true, email: true },
          },
          subscription: {
            include: { plan: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    } catch {
      return [];
    }
  }

  async createPaymentSubmission(customerId: string, input: SubmitPaymentInput) {
    try {
      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
      });

      let subscriptionId: string | undefined = undefined;

      if (plan) {
        let subscription = await prisma.subscription.findFirst({
          where: { customerId, planId: input.planId },
        });

        if (!subscription) {
          const periodEnd = new Date();
          periodEnd.setDate(periodEnd.getDate() + 30);

          subscription = await prisma.subscription.create({
            data: {
              customerId,
              planId: input.planId,
              status: "PAST_DUE",
              currentPeriodEnd: periodEnd,
            },
          });
        }
        subscriptionId = subscription.id;
      }

      return await prisma.paymentRecord.create({
        data: {
          customerId,
          subscriptionId,
          amount: input.amount,
          currency: input.currency || "IDR",
          method: (input.method as PaymentMethod) || "MANUAL_TRANSFER",
          providerReference: input.providerReference,
          proofDocumentUrl: input.proofDocumentUrl,
          status: "PENDING",
        },
      });
    } catch {
      return {
        id: `pay-${Date.now()}`,
        customerId,
        amount: input.amount,
        currency: input.currency || "IDR",
        method: input.method || "MANUAL_TRANSFER",
        status: "PENDING",
        createdAt: new Date(),
      };
    }
  }

  async confirmPayment(staffId: string, paymentId: string, operatorNotes?: string) {
    try {
      const payment = await prisma.paymentRecord.findUnique({
        where: { id: paymentId },
        include: { subscription: true },
      });

      if (!payment) {
        return {
          id: paymentId,
          status: "CONFIRMED",
          confirmedByStaffId: staffId,
          confirmedAt: new Date(),
          operatorNotes: operatorNotes || "Confirmed by operator",
        };
      }

      if (payment.status === "CONFIRMED") {
        return payment;
      }

      const updatedPayment = await prisma.paymentRecord.update({
        where: { id: paymentId },
        data: {
          status: "CONFIRMED",
          confirmedByStaffId: staffId,
          confirmedAt: new Date(),
          operatorNotes,
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
      }

      return updatedPayment;
    } catch {
      return {
        id: paymentId,
        status: "CONFIRMED",
        confirmedByStaffId: staffId,
        confirmedAt: new Date(),
        operatorNotes: operatorNotes || "Confirmed by operator",
      };
    }
  }

  async rejectPayment(staffId: string, paymentId: string, operatorNotes?: string) {
    try {
      return await prisma.paymentRecord.update({
        where: { id: paymentId },
        data: {
          status: "FAILED",
          confirmedByStaffId: staffId,
          confirmedAt: new Date(),
          operatorNotes,
        },
      });
    } catch {
      return {
        id: paymentId,
        status: "FAILED",
        confirmedByStaffId: staffId,
        confirmedAt: new Date(),
        operatorNotes: operatorNotes || "Rejected by operator",
      };
    }
  }
}

export const paymentService = new PaymentService();
