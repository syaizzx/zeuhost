import { NextResponse } from "next/server";
import { planService } from "@/services/plan.service";

export async function GET() {
  try {
    const plans = await planService.getActivePlans();
    return NextResponse.json({ success: true, data: plans });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch plans";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
