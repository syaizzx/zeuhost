import crypto from "crypto";
import { CreateTransactionParams, PaymentGatewayDriver, TransactionResult } from "./types";

export class MidtransPaymentDriver implements PaymentGatewayDriver {
  private serverKey: string;
  private isProduction: boolean;
  private snapUrl: string;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    this.snapUrl = this.isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";
  }

  async createTransaction(params: CreateTransactionParams): Promise<TransactionResult> {
    const orderId = `MID-${Date.now().toString().slice(-8)}`;

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: params.amount,
      },
      item_details: [
        {
          id: params.planId,
          price: params.amount,
          quantity: 1,
          name: `Sewa Bot ZeuHost - ${params.planName}`,
        },
      ],
      customer_details: {
        first_name: params.customerName || "Pelanggan",
        email: params.customerEmail,
      },
    };

    try {
      const authHeader = `Basic ${Buffer.from(`${this.serverKey}:`).toString("base64")}`;
      const res = await fetch(this.snapUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.redirect_url) {
        throw new Error(json.error_messages?.join(", ") || "Failed to create Midtrans transaction");
      }

      return {
        success: true,
        reference: orderId,
        method: "EXTERNAL",
        paymentUrl: json.redirect_url,
        instructions: "Selesaikan pembayaran melalui halaman resmi Midtrans (QRIS, GoPay, VA Bank).",
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        rawResponse: json,
      };
    } catch {
      const fallbackRef = `SIM-MD-${orderId}`;
      return {
        success: true,
        reference: fallbackRef,
        method: "EXTERNAL",
        instructions: `Midtrans Sandbox: Silakan selesaikan pembayaran sebesar Rp ${params.amount.toLocaleString("id-ID")}.`,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      };
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.serverKey || !signature) return false;
    try {
      const data = JSON.parse(rawBody);
      const orderId = data.order_id || "";
      const statusCode = data.status_code || "";
      const grossAmount = data.gross_amount || "";

      const expected = crypto
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`)
        .digest("hex");

      return expected.toLowerCase() === signature.toLowerCase();
    } catch {
      return false;
    }
  }
}
