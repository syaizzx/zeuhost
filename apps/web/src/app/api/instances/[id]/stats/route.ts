import { NextRequest, NextResponse } from "next/server";
import { botService } from "@/services/bot.service";
import { requireSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id: instanceId } = await params;

    const stats = await botService.getStats(user.id, instanceId);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
