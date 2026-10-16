import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { paymentService } from "@/services/payment.service";
import { requireSession } from "@/lib/session";

const checkoutSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const transaction = await paymentService.initiateCheckout(user.id, parsed.data.planId);
    return NextResponse.json({ success: true, data: transaction });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initiate checkout";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
