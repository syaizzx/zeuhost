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
    const path = req.nextUrl.searchParams.get("path") || "/app";

    const files = await botService.listFiles(user.id, instanceId, path);
    return NextResponse.json({ success: true, path, files });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list files";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id: instanceId } = await params;
    const targetPath = req.nextUrl.searchParams.get("path");

    if (!targetPath) {
      return NextResponse.json({ success: false, error: "Path query parameter required" }, { status: 400 });
    }

    await botService.deleteFile(user.id, instanceId, targetPath);
    return NextResponse.json({ success: true, path: targetPath });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete file";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
