export type PaymentProvider = "MANUAL" | "TRIPAY" | "MIDTRANS";

export interface CreateTransactionParams {
  customerId: string;
  customerEmail: string;
  customerName?: string | null;
  planId: string;
  planName: string;
  amount: number;
  currency?: string;
}

export interface TransactionResult {
  success: boolean;
  reference: string;
  method: "MANUAL_TRANSFER" | "EXTERNAL" | "STRIPE" | "CRYPTO";
  paymentUrl?: string;
  qrString?: string;
  instructions: string;
  expiresAt?: Date;
  rawResponse?: Record<string, unknown>;
}

export interface PaymentGatewayDriver {
  createTransaction(params: CreateTransactionParams): Promise<TransactionResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}
