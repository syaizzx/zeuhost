import { auth } from "./auth";
import { headers } from "next/headers";

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

    if (!session?.user) return null;

    let role: SessionUser["role"] = "CUSTOMER";
    if ("role" in session.user && typeof session.user.role === "string") {
      if (session.user.role === "OWNER" || session.user.role === "STAFF") {
        role = session.user.role;
      }
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
      role,
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
