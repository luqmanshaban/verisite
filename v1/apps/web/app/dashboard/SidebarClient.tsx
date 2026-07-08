"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

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
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sidebarContent = (
    <>
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
            <button style={styles.upgradeBtn}>Upgrade → $9/mo</button>
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
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside style={styles.sidebar} className="verisite-sidebar-desktop">
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ── */}
      <div style={styles.mobileTopBar} className="verisite-sidebar-mobile">
        <span style={styles.logo}>VERISITE</span>
        {isPro ? (
          <span style={styles.proBadge}>PRO</span>
        ) : (
          <span style={styles.freeBadge}>FREE</span>
        )}
        <button
          style={styles.hamburger}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          style={styles.overlay}
          className="verisite-sidebar-mobile"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        style={{
          ...styles.drawer,
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
        className="verisite-sidebar-mobile"
      >
        {sidebarContent}
      </aside>

      {/* Responsive styles injected via a style tag */}
      <style>{`
        .verisite-sidebar-desktop { display: flex; }
        .verisite-sidebar-mobile  { display: none; }

        @media (max-width: 768px) {
          .verisite-sidebar-desktop { display: none !important; }
          .verisite-sidebar-mobile  { display: flex; }
        }
      `}</style>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  /* ── Desktop sidebar ── */
  sidebar: {
    width: "220px",
    minWidth: "220px",
    background: "#0D0D0D",
    flexDirection: "column",
    height: "100vh",
    position: "sticky",
    top: 0,
    boxSizing: "border-box",
  },

  /* ── Mobile top bar ── */
  mobileTopBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "52px",
    background: "#0D0D0D",
    alignItems: "center",
    gap: "8px",
    padding: "0 16px",
    zIndex: 100,
    boxSizing: "border-box",
  },

  hamburger: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    color: "#ffffff",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
    lineHeight: 1,
  },

  /* ── Mobile drawer ── */
  drawer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "260px",
    height: "100vh",
    background: "#0D0D0D",
    flexDirection: "column",
    zIndex: 200,
    transition: "transform 0.25s ease",
    overflowY: "auto",
    boxSizing: "border-box",
  },

  /* ── Overlay ── */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 150,
  },

  /* ── Shared sidebar internals ── */
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
    flexDirection: "column",
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
    textAlign: "center",
    flexShrink: 0,
  },
  bottom: {
    padding: "16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
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
    marginBottom: "6px",
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
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
    fontFamily: "'Inter', sans-serif",
    whiteSpace: "nowrap",
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
    textAlign: "center",
  },
};