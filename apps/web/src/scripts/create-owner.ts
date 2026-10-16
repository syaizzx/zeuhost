import { auth } from "../lib/auth";
import { prisma } from "@zeuhost/db";

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;
  const name = process.argv[4] || process.env.ADMIN_NAME || "Operator Utama";

  if (!email || !password) {
    console.error("Missing email or password arguments");
    process.exit(1);
  }

  try {
    // Try sign up via Better Auth to create User + hashed Account
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
  } catch {
    // If user already exists, update password via Better Auth setPassword if available
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        // Find existing credential account or create one
        await prisma.account.deleteMany({
          where: { userId: existingUser.id, providerId: "credential" },
        });
        await auth.api.signUpEmail({
          body: {
            email,
            password,
            name,
          },
        });
      }
    } catch {
      // Ignore fallback errors
    }
  }

  // Ensure role is OWNER, status is ACTIVE, and emailVerified is true
  await prisma.user.updateMany({
    where: { email },
    data: {
      role: "OWNER",
      status: "ACTIVE",
      emailVerified: true,
      name,
    },
  });

  console.log(`[+] Akun Owner berhasil disiapkan: ${email}`);
}

main()
  .catch((e) => {
    console.error("Error creating owner account:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
