import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { paymentService } from "@/services/payment.service";
import { requireSession } from "@/lib/session";

const paymentSubmissionSchema = z.object({
  planId: z.string().min(1),
  amount: z.number().int().min(1),
  currency: z.string().default("IDR"),
  method: z.enum(["MANUAL_TRANSFER", "STRIPE", "CRYPTO", "EXTERNAL"]).default("MANUAL_TRANSFER"),
  providerReference: z.string().optional(),
  proofDocumentUrl: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireSession();
    const payments = await paymentService.getCustomerPayments(user.id);
    return NextResponse.json({ success: true, data: payments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch payments";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = await req.json();
    const parseResult = paymentSubmissionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const payment = await paymentService.createPaymentSubmission(user.id, parseResult.data);
    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit payment";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
