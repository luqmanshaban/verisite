"use client";

import { useEffect, useState } from "react";

interface Stats {
  totals: {
    users: number;
    scans: number;
    anonymousScans: number;
    loggedInScans: number;
    completedScans: number;
    verifiedDomains: number;
    pendingDomains: number;
  };
  engagement: {
    uniqueScanners: number;
    repeatUsers: number;
    powerUsers: number;
  };
  recentUsers: { email: string; name: string; plan: string; createdAt: string | null }[];
  recentScans: { domain: string; userId: string; status: string; score: number | null; grade: string | null; createdAt: string | null }[];
  topScanners: { _id: string; count: number }[];
}

export default function AdminClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.page}><p>Loading...</p></div>;
  if (!stats) return <div style={styles.page}><p>Failed to load stats.</p></div>;

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Admin — Verisite</h1>

      {/* Validation signal — the number that actually matters */}
      <div style={styles.signalBanner}>
        <div>
          <p style={styles.signalLabel}>VALIDATION SIGNAL</p>
          <p style={styles.signalValue}>
            {stats.engagement.repeatUsers} users with 3+ scans
          </p>
        </div>
        <div>
          <p style={styles.signalLabel}>HITTING LIMITS</p>
          <p style={styles.signalValue}>
            {stats.engagement.powerUsers} users with 10+ scans
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div style={styles.statsGrid}>
        <StatBox label="Total Users" value={stats.totals.users} />
        <StatBox label="Unique Scanners" value={stats.engagement.uniqueScanners} />
        <StatBox label="Total Scans" value={stats.totals.scans} />
        <StatBox label="Completed" value={stats.totals.completedScans} />
        <StatBox label="Anonymous Scans" value={stats.totals.anonymousScans} />
        <StatBox label="Logged-in Scans" value={stats.totals.loggedInScans} />
        <StatBox label="Verified Domains" value={stats.totals.verifiedDomains} />
        <StatBox label="Pending Domains" value={stats.totals.pendingDomains} />
      </div>

      {/* Top scanners */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>TOP SCANNERS</p>
        <div style={styles.list}>
          {stats.topScanners.map((u, i) => (
            <div key={u._id} style={styles.listRow}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--muted)" }}>
                #{i + 1}
              </span>
              <span style={{ flex: 1, fontSize: "13px", fontFamily: "'JetBrains Mono', monospace" }}>
                {u._id}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>
                {u.count} scans
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>RECENT SIGNUPS</p>
        <div style={styles.list}>
          {stats.recentUsers.map((u) => (
            <div key={u.email} style={styles.listRow}>
              <span style={{ flex: 1, fontSize: "13px" }}>{u.email}</span>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>{u.plan}</span>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                {formatDate(u.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent scans */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>RECENT SCANS</p>
        <div style={styles.list}>
          {stats.recentScans.map((s, i) => (
            <div key={i} style={styles.listRow}>
              <span style={{ flex: 1, fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif" }}>
                {s.domain}
              </span>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                {s.userId === "anonymous" ? "anon" : "user"}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>
                {s.grade ?? "—"} {s.score != null ? `(${s.score})` : ""}
              </span>
              <span style={{
                fontSize: "11px",
                padding: "2px 6px",
                background: s.status === "completed" ? "#D4EDDA" : "#FFF3CD",
                color: s.status === "completed" ? "#155724" : "#856404",
              }}>
                {s.status}
              </span>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                {formatDate(s.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={statStyles.box}>
      <p style={statStyles.value}>{value}</p>
      <p style={statStyles.label}>{label}</p>
    </div>
  );
}

const statStyles: Record<string, React.CSSProperties> = {
  box: {
    background: "white",
    border: "1px solid var(--border)",
    padding: "16px",
  },
  value: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "24px",
    fontWeight: 600,
    marginBottom: "4px",
  },
  label: {
    fontSize: "11px",
    color: "var(--muted)",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.04em",
  },
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 40px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "22px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    marginBottom: "24px",
  },
  signalBanner: {
    display: "flex",
    gap: "24px",
    background: "#0D0D0D",
    color: "white",
    padding: "20px 24px",
    marginBottom: "28px",
  },
  signalLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: "0.06em",
    marginBottom: "6px",
  },
  signalValue: {
    fontSize: "18px",
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginBottom: "32px",
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
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  listRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    background: "white",
    border: "1px solid var(--border)",
  },
};