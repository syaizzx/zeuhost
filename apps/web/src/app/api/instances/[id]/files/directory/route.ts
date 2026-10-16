import { NextRequest, NextResponse } from "next/server";
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

    if (!body.path) {
      return NextResponse.json({ success: false, error: "Field 'path' is required" }, { status: 400 });
    }

    await botService.createDirectory(user.id, instanceId, body.path);
    return NextResponse.json({ success: true, path: body.path });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create directory";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
