import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[+] Seeding default ZeuHost database records...");

  // 1. Seed Singleton Branding
  await prisma.brandingSetting.upsert({
    where: { id: "branding_config" },
    update: {},
    create: {
      id: "branding_config",
      productName: "ZeuHost",
      companyName: "Zeuzz",
      primaryColor: "#09090B",
      accentColor: "#10B981",
      supportEmail: "support@zeuhost.org",
      footerText: "Layanan Hosting Bot WhatsApp dan Discord",
      landingHeadline: "Sewa dan jalankan bot kamu 24 jam tanpa perlu menyalakan laptop.",
      landingSubheadline: "ZeuHost menyediakan hosting bot untuk WhatsApp, Discord, dan Telegram. Cukup hubungkan sekali dari browser, bot kamu langsung aktif melayani chat pelanggan atau komunitas.",
    },
  });
  console.log("[+] Seeded singleton BrandingSetting.");

  // 2. Seed Default Plans
  const plans = [
    {
      slug: "plan-starter",
      name: "Starter Trial",
      description: "Uji coba performa dan stabilitas bot gratis tanpa kartu kredit.",
      priceMonthly: 0,
      currency: "IDR",
      maxInstances: 1,
      maxMemoryPerInstanceMb: 256,
      maxCpuPerInstance: 0.5,
      maxStorageMb: 512,
      isActive: true,
    },
    {
      slug: "plan-pro",
      name: "Pro Jadibot",
      description: "Paling pas untuk toko online, bot grup aktif, dan server komunitas.",
      priceMonthly: 25000,
      currency: "IDR",
      maxInstances: 3,
      maxMemoryPerInstanceMb: 512,
      maxCpuPerInstance: 0.5,
      maxStorageMb: 1024,
      isActive: true,
    },
    {
      slug: "plan-reseller",
      name: "Operator Reseller",
      description: "Untuk reseller atau komunitas besar yang ingin mengelola banyak bot.",
      priceMonthly: 75000,
      currency: "IDR",
      maxInstances: 10,
      maxMemoryPerInstanceMb: 2048,
      maxCpuPerInstance: 1.0,
      maxStorageMb: 4096,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log(`[+] Seeded ${plans.length} subscription plans.`);

  // 3. Seed Default Bot Templates
  const templates = [
    {
      slug: "whatsapp-baileys-starter",
      name: "WhatsApp Bot (Baileys v6)",
      description: "Template Jadibot WhatsApp dengan auto-responder toko online dan moderasi grup.",
      category: "messaging",
      runtime: "NODEJS" as const,
      dockerImage: "zeuhost/template-whatsapp-baileys:1.0.0",
      versionTag: "1.0.0",
    },
    {
      slug: "discord-js-starter",
      name: "Discord.js Bot Starter",
      description: "Template resmi bot Discord menggunakan Discord.js v14 dengan slash commands.",
      category: "community",
      runtime: "NODEJS" as const,
      dockerImage: "zeuhost/template-discord-js:1.0.0",
      versionTag: "1.0.0",
    },
    {
      slug: "python-telegram-starter",
      name: "Python Telegram Bot Starter",
      description: "Template resmi bot Telegram menggunakan python-telegram-bot v21.",
      category: "automation",
      runtime: "PYTHON" as const,
      dockerImage: "zeuhost/template-telegram-py:1.0.0",
      versionTag: "1.0.0",
    },
  ];

  for (const tpl of templates) {
    const createdTemplate = await prisma.botTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        runtime: tpl.runtime,
      },
      create: {
        slug: tpl.slug,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        runtime: tpl.runtime,
        isOfficial: true,
        isActive: true,
      },
    });

    await prisma.botTemplateVersion.upsert({
      where: {
        templateId_versionTag: {
          templateId: createdTemplate.id,
          versionTag: tpl.versionTag,
        },
      },
      update: {
        dockerImage: tpl.dockerImage,
      },
      create: {
        templateId: createdTemplate.id,
        versionTag: tpl.versionTag,
        dockerImage: tpl.dockerImage,
        requiredEnvSchema: {},
        defaultResourceLimits: { memoryMb: 256, cpuCores: 0.5 },
        isActive: true,
      },
    });
  }
  console.log(`[+] Seeded ${templates.length} official bot templates.`);
  console.log("[+] Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("[-] Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
