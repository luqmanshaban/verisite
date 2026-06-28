import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarClient from "./SidebarClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div style={styles.shell}>
      <SidebarClient user={session.user} />
      <main style={styles.content}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--paper)",
  },
  content: {
    flex: 1,
    minWidth: 0,
    overflowY: "auto" as const,
  },
};