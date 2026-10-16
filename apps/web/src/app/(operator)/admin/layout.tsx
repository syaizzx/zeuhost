import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  // Strict Role Guard: Only OWNER or STAFF can access /admin
  if (user.role !== "OWNER" && user.role !== "STAFF") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
