import { NextResponse } from "next/server";
import { prisma } from "@zeuhost/db";

export async function GET() {
  try {
    const templates = await prisma.botTemplate.findMany({
      where: { isActive: true },
      include: {
        versions: {
          where: { isActive: true },
          select: {
            id: true,
            versionTag: true,
            dockerImage: true,
            requiredEnvSchema: true,
            defaultResourceLimits: true,
            startupCommand: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch templates";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
