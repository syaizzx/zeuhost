import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";
import { requireRole } from "@/lib/session";

export async function GET() {
  try {
    await requireRole("OWNER", "STAFF");
    const pending = await paymentService.getPendingPayments();
    return NextResponse.json({ success: true, data: pending });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch pending payments";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: message }, { status: message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
