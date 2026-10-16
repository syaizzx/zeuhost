import { NextRequest } from "next/server";
import { botService } from "@/services/bot.service";
import { requireSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id: instanceId } = await params;
    const tail = parseInt(req.nextUrl.searchParams.get("tail") || "50", 10);

    const stream = await botService.getLogsStream(user.id, instanceId, isNaN(tail) ? 50 : tail);

    if (!stream) {
      return new Response("No log stream available", { status: 404 });
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to open stream";
    if (message === "UNAUTHORIZED") {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response(message, { status: 500 });
  }
}
