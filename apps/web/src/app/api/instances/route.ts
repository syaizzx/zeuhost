import { NextRequest, NextResponse } from "next/server";
import { createBotInstanceSchema } from "@zeuhost/shared";
import { botService } from "@/services/bot.service";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireSession();
    const instances = await botService.getCustomerInstances(user.id);
    return NextResponse.json({ success: true, data: instances });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch instances";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = await req.json();
    const parseResult = createBotInstanceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const newInstance = await botService.createInstance(user.id, parseResult.data);
    return NextResponse.json({ success: true, data: newInstance }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create instance";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
