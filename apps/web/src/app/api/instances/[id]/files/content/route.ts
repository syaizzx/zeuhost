import { NextRequest, NextResponse } from "next/server";
import { botService } from "@/services/bot.service";
import { requireSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id: instanceId } = await params;
    const filePath = req.nextUrl.searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ success: false, error: "Path query parameter required" }, { status: 400 });
    }

    const content = await botService.readFile(user.id, instanceId, filePath);
    return NextResponse.json({ success: true, path: filePath, content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to read file";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id: instanceId } = await params;
    const body = await req.json();

    if (!body.path || typeof body.content !== "string") {
      return NextResponse.json({ success: false, error: "Fields 'path' and 'content' are required" }, { status: 400 });
    }

    await botService.writeFile(user.id, instanceId, body.path, body.content);
    return NextResponse.json({ success: true, path: body.path });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to write file";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
