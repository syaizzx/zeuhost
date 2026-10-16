import { NextResponse } from "next/server";
import { planService } from "@/services/plan.service";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireSession();
    const subscription = await planService.getCustomerActiveSubscription(user.id);

    return NextResponse.json({
      success: true,
      hasActiveSubscription: !!subscription,
      subscription,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch customer subscription";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
