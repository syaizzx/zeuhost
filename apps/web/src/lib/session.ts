import { auth } from "./auth";
import { headers } from "next/headers";
import { prisma } from "@zeuhost/db";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: "OWNER" | "STAFF" | "CUSTOMER";
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const headerStore = await headers();
    const session = await auth.api.getSession({
      headers: headerStore,
    });

    if (!session?.user?.id) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!dbUser || dbUser.status === "SUSPENDED") return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name ?? null,
      role: dbUser.role,
    };
  } catch {
    return null;
  }
}
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(...roles: SessionUser["role"][]): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
