import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { paymentService } from "@/services/payment.service";

const paymentSubmissionSchema = z.object({
  planId: z.string().min(1),
  amount: z.number().int().min(1),
  currency: z.string().default("IDR"),
  method: z.enum(["MANUAL_TRANSFER", "STRIPE", "CRYPTO", "EXTERNAL"]).default("MANUAL_TRANSFER"),
  providerReference: z.string().optional(),
  proofDocumentUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const customerId = req.headers.get("x-customer-id") || "demo-customer-id";
  try {
    const payments = await paymentService.getCustomerPayments(customerId);
    return NextResponse.json({ success: true, data: payments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch payments";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const customerId = req.headers.get("x-customer-id") || "demo-customer-id";

  try {
    const body = await req.json();
    const parseResult = paymentSubmissionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const payment = await paymentService.createPaymentSubmission(customerId, parseResult.data);
    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit payment";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
