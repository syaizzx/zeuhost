import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { OperatorAdminClient } from "./admin-client";

export default async function OperatorAdminPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  // Strict Role Guard: Only OWNER or STAFF can view the admin interface!
  if (user.role !== "OWNER" && user.role !== "STAFF") {
    redirect("/dashboard");
  }

  return <OperatorAdminClient user={user} />;
}
