import { NextRequest, NextResponse } from "next/server";
import { MidtransPaymentDriver } from "@/services/payment-gateway";
import { paymentService } from "@/services/payment.service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const data = JSON.parse(rawBody);
    const signature = data.signature_key || "";

    const driver = new MidtransPaymentDriver();
    const isValid = driver.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid Midtrans signature" }, { status: 403 });
    }

    const transactionStatus = data.transaction_status;
    const fraudStatus = data.fraud_status;
    const orderId = data.order_id;

    if (
      (transactionStatus === "capture" && fraudStatus === "accept") ||
      transactionStatus === "settlement"
    ) {
      await paymentService.handlePaymentSuccess(orderId, data);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook handling failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
