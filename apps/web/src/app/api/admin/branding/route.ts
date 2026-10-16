import { NextRequest, NextResponse } from "next/server";
import { updateBrandingSchema } from "@zeuhost/shared";
import { brandingService } from "@/services/branding.service";
import { requireRole } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    await requireRole("OWNER", "STAFF");
    const body = await req.json();
    const parseResult = updateBrandingSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const updated = await brandingService.updateBranding(parseResult.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update branding";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: message }, { status: message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
