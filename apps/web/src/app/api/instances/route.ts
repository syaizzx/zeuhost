import { NextRequest, NextResponse } from "next/server";
import { createBotInstanceSchema } from "@zeuhost/shared";
import { botService } from "@/services/bot.service";

export async function GET(req: NextRequest) {
  // Mock customer ID for dev / unauthenticated requests
  const customerId = req.headers.get("x-customer-id") || "demo-customer-id";

  try {
    const instances = await botService.getCustomerInstances(customerId);
    return NextResponse.json({ success: true, data: instances });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch instances";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const customerId = req.headers.get("x-customer-id") || "demo-customer-id";

  try {
    const body = await req.json();
    const parseResult = createBotInstanceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const newInstance = await botService.createInstance(customerId, parseResult.data);
    return NextResponse.json({ success: true, data: newInstance }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create instance";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
