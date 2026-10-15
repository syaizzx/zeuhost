import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staffId = req.headers.get("x-staff-id") || "operator-owner";
  const { id: paymentId } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const confirmed = await paymentService.confirmPayment(staffId, paymentId, body.operatorNotes);
    return NextResponse.json({ success: true, data: confirmed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to confirm payment";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
