import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/is-admin";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  return <AdminClient />;
}