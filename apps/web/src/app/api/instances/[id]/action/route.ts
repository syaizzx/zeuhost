import { NextRequest, NextResponse } from "next/server";
import { botActionSchema } from "@zeuhost/shared";
import { botService } from "@/services/bot.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const customerId = req.headers.get("x-customer-id") || "demo-customer-id";
  const { id: instanceId } = await params;

  try {
    const body = await req.json();
    const parseResult = botActionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Allowed: START, STOP, RESTART" },
        { status: 400 }
      );
    }

    const updated = await botService.performAction(customerId, instanceId, parseResult.data.action);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to perform action";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
