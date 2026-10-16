import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";
import { requireRole } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireRole("OWNER", "STAFF");
    const { id: paymentId } = await params;
    const body = await req.json().catch(() => ({}));
    const rejected = await paymentService.rejectPayment(staff.id, paymentId, body.operatorNotes);
    return NextResponse.json({ success: true, data: rejected });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reject payment";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: message }, { status: message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
