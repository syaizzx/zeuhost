import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";

export async function GET() {
  try {
    const admin = await requireRole("OWNER", "STAFF");
    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
