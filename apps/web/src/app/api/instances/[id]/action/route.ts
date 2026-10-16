import { NextRequest, NextResponse } from "next/server";
import { botActionSchema } from "@zeuhost/shared";
import { botService } from "@/services/bot.service";
import { requireSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id: instanceId } = await params;
    const body = await req.json();
    const parseResult = botActionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Allowed: START, STOP, RESTART" },
        { status: 400 }
      );
    }

    const updated = await botService.performAction(user.id, instanceId, parseResult.data.action);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to perform action";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
