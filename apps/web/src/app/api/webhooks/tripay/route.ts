import { NextRequest, NextResponse } from "next/server";
import { TripayPaymentDriver } from "@/services/payment-gateway";
import { paymentService } from "@/services/payment.service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-callback-signature") || "";

    const driver = new TripayPaymentDriver();
    const isValid = driver.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid callback signature" }, { status: 403 });
    }

    const data = JSON.parse(rawBody);
    const event = req.headers.get("x-callback-event");

    if (event === "payment_status" && data.status === "PAID") {
      const merchantRef = data.merchant_ref || data.reference;
      await paymentService.handlePaymentSuccess(merchantRef, data);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook handling failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
