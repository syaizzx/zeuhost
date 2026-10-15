import { NextResponse } from "next/server";
import { brandingService } from "@/services/branding.service";

export async function GET() {
  const branding = await brandingService.getBranding();
  return NextResponse.json({ success: true, data: branding });
}
