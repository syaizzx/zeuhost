import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";

export async function GET() {
  try {
    const pending = await paymentService.getPendingPayments();
    return NextResponse.json({ success: true, data: pending });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch pending payments";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
