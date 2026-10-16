import { CreateTransactionParams, PaymentGatewayDriver, TransactionResult } from "./types";

export class ManualPaymentDriver implements PaymentGatewayDriver {
  private bankName: string;
  private accountNumber: string;
  private accountName: string;

  constructor() {
    this.bankName = process.env.MANUAL_BANK_NAME || "BCA";
    this.accountNumber = process.env.MANUAL_ACCOUNT_NUMBER || "8420198888";
    this.accountName = process.env.MANUAL_ACCOUNT_NAME || "ZeuHost Operator";
  }

  async createTransaction(params: CreateTransactionParams): Promise<TransactionResult> {
    const reference = `MANUAL-${Date.now().toString().slice(-8)}`;
    const instructions = `Silakan transfer tepat sebesar Rp ${params.amount.toLocaleString("id-ID")} ke rekening ${this.bankName} ${this.accountNumber} a/n ${this.accountName}. Simpan struk/bukti transfer untuk konfirmasi.`;

    return {
      success: true,
      reference,
      method: "MANUAL_TRANSFER",
      instructions,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  verifyWebhookSignature(): boolean {
    // Manual payments require staff review, no automated webhook
    return false;
  }
}
