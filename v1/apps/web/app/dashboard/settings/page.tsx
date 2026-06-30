import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isPro = session.user.plan === "pro";

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Settings</h1>
        <p style={styles.subheading}>Manage your account and plan.</p>
      </div>

      {/* Account */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>ACCOUNT</p>
        <div style={styles.card}>
          <Row label="Name" value={session.user.name ?? "—"} />
          <Row label="Email" value={session.user.email ?? "—"} />
          <Row label="Plan" value={isPro ? "Pro" : "Free"} highlight={isPro} />
        </div>
      </div>

      {/* Plan */}
      {!isPro && (
        <div style={styles.section}>
          <p style={styles.sectionLabel}>UPGRADE</p>
          <div style={styles.upgradeCard}>
            <div>
              <p style={styles.upgradeTitle}>Pro plan — $9/month</p>
              <p style={styles.upgradeDesc}>
                Unlimited scans · Unlimited domains · Full history
              </p>
            </div>
            <button style={styles.upgradeBtn}>
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      {/* Limits */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>PLAN LIMITS</p>
        <div style={styles.card}>
          <Row label="Daily scans" value={isPro ? "Unlimited" : "3/day"} />
          <Row label="Domains" value={isPro ? "Unlimited" : "1 domain"} />
          <Row label="History" value={isPro ? "Full history" : "7 days"} />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={rowStyles.row}>
      <span style={rowStyles.label}>{label}</span>
      <span style={{
        ...rowStyles.value,
        color: highlight ? "var(--safe)" : "var(--ink)",
        fontWeight: highlight ? 600 : 400,
      }}>
        {value}
      </span>
    </div>
  );
}

const rowStyles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
  },
  label: {
    fontSize: "13px",
    color: "var(--muted)",
    fontFamily: "'Inter', sans-serif",
  },
  value: {
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 40px",
    maxWidth: "560px",
  },
  header: {
    marginBottom: "28px",
  },
  heading: {
    fontSize: "24px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    marginBottom: "4px",
  },
  subheading: {
    fontSize: "13px",
    color: "var(--muted)",
    fontFamily: "'Inter', sans-serif",
  },
  section: {
    marginBottom: "28px",
  },
  sectionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "var(--muted)",
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },
  card: {
    border: "1px solid var(--border)",
    background: "white",
    overflow: "hidden",
  },
  upgradeCard: {
    border: "1px solid var(--border)",
    background: "white",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap" as const,
  },
  upgradeTitle: {
    fontSize: "14px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    marginBottom: "4px",
  },
  upgradeDesc: {
    fontSize: "12px",
    color: "var(--muted)",
    fontFamily: "'Inter', sans-serif",
  },
  upgradeBtn: {
    padding: "10px 20px",
    background: "var(--ink)",
    color: "var(--paper)",
    border: "none",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: "pointer",
    flexShrink: 0,
  },
};