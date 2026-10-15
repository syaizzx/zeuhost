import { NextResponse } from "next/server";
import { prisma } from "@zeuhost/db";

const DEFAULT_TEMPLATES = [
  {
    id: "tpl-wa",
    name: "WhatsApp Bot (Baileys v6)",
    slug: "whatsapp-baileys-starter",
    runtime: "NODEJS",
    description: "Template Jadibot WhatsApp dengan auto-responder toko online dan moderasi grup.",
    versions: [
      {
        id: "ver-wa-1",
        versionTag: "1.0.0",
        dockerImage: "zeuhost/template-whatsapp-baileys:1.0.0",
      },
    ],
  },
  {
    id: "tpl-dc",
    name: "Discord.js Bot Starter",
    slug: "discord-js-starter",
    runtime: "NODEJS",
    description: "Template resmi bot Discord menggunakan Discord.js v14 dengan slash commands.",
    versions: [
      {
        id: "ver-dc-1",
        versionTag: "1.0.0",
        dockerImage: "zeuhost/template-discord-js:1.0.0",
      },
    ],
  },
  {
    id: "tpl-tg",
    name: "Python Telegram Bot Starter",
    slug: "python-telegram-starter",
    runtime: "PYTHON",
    description: "Template resmi bot Telegram menggunakan python-telegram-bot v21.",
    versions: [
      {
        id: "ver-tg-1",
        versionTag: "1.0.0",
        dockerImage: "zeuhost/template-telegram-py:1.0.0",
      },
    ],
  },
];

export async function GET() {
  try {
    const templates = await prisma.botTemplate.findMany({
      where: { isActive: true },
      include: {
        versions: {
          where: { isActive: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: templates.length > 0 ? templates : DEFAULT_TEMPLATES,
    });
  } catch {
    return NextResponse.json({ success: true, data: DEFAULT_TEMPLATES });
  }
}
