import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";

export async function GET() {
  try {
    const config = await paymentService.getPaymentConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load payment config";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
