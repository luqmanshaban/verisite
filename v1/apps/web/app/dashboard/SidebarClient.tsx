"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    plan?: string | null;
  };
}

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "⊞" },
  { label: "Scans", href: "/dashboard/scans", icon: "↗" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙" },
];

export default function SidebarClient({ user }: Props) {
  const pathname = usePathname();
  const isPro = user.plan === "pro";

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoArea}>
        <span style={styles.logo}>VERISITE</span>
        {isPro ? (
          <span style={styles.proBadge}>PRO</span>
        ) : (
          <span style={styles.freeBadge}>FREE</span>
        )}
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navItem,
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                color: active ? "#ffffff" : "rgba(255,255,255,0.5)",
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={styles.bottom}>
        {!isPro && (
          <div style={styles.upgradeCard}>
            <p style={styles.upgradeTitle}>Free plan</p>
            <p style={styles.upgradeDesc}>10 scans/day · 1 domain</p>
            <button style={styles.upgradeBtn}>
              Upgrade → $9/mo
            </button>
            <p className="text-green-500 italic text-xs underline text-center">coming soon</p>
          </div>
        )}

        <div style={styles.userRow}>
          <div style={styles.avatar}>
            {(user.name ?? user.email ?? "?")[0].toUpperCase()}
          </div>
          <div style={styles.userInfo}>
            <p style={styles.userName}>
              {user.name ?? user.email?.split("@")[0]}
            </p>
            <p style={styles.userEmail}>{user.email}</p>
          </div>
        </div>

        <button
          style={styles.signOutBtn}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "220px",
    minWidth: "220px",
    background: "#0D0D0D",
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    position: "sticky" as const,
    top: 0,
    padding: "0",
    boxSizing: "border-box" as const,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "24px 20px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  logo: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    letterSpacing: "0.14em",
    color: "#ffffff",
  },
  freeBadge: {
    fontSize: "9px",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    letterSpacing: "0.06em",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "2px 5px",
    color: "rgba(255,255,255,0.4)",
  },
  proBadge: {
    fontSize: "9px",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    letterSpacing: "0.06em",
    border: "1px solid #2A9D8F",
    padding: "2px 5px",
    color: "#2A9D8F",
  },
  nav: {
    flex: 1,
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 500,
    textDecoration: "none",
    transition: "background 0.15s, color 0.15s",
    cursor: "pointer",
  },
  navIcon: {
    fontSize: "14px",
    width: "16px",
    textAlign: "center" as const,
    flexShrink: 0,
  },
  bottom: {
    padding: "16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  upgradeCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "6px",
    padding: "12px",
  },
  upgradeTitle: {
    fontSize: "12px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    color: "#ffffff",
    marginBottom: "2px",
  },
  upgradeDesc: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: "10px",
  },
  upgradeBtn: {
    width: "100%",
    padding: "8px",
    background: "#ffffff",
    color: "#0D0D0D",
    border: "none",
    fontSize: "12px",
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: "pointer",
    borderRadius: "4px",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    flexShrink: 0,
  },
  userInfo: {
    minWidth: 0,
    flex: 1,
  },
  userName: {
    fontSize: "12px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    color: "#ffffff",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
    fontFamily: "'Inter', sans-serif",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  signOutBtn: {
    width: "100%",
    padding: "8px",
    background: "transparent",
    color: "rgba(255,255,255,0.4)",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: "12px",
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: "pointer",
    borderRadius: "4px",
    textAlign: "center" as const,
  },
};