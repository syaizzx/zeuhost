import { NextRequest, NextResponse } from "next/server";
import { billingCronService } from "@/services/billing-cron.service";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const customHeader = req.headers.get("x-cron-secret") || "";

    if (token !== cronSecret && customHeader !== cronSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized cron execution" }, { status: 401 });
    }
  }

  try {
    const report = await billingCronService.runSubscriptionLifecycleCheck();
    return NextResponse.json({ success: true, data: report });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Cron execution failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
