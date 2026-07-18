"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ScanItem {
  scanId: string;
  domain: string;
  url: string;
  status: string;
  score: number | null;
  grade: string | null;
  createdAt: string | null;
}

interface Props {
  scans: ScanItem[];
  user: {
    name?: string | null;
    email?: string | null;
    plan?: string | null;
  };
  todayCount: number;
}

const FREE_DAILY_LIMIT = 10;

export default function OverviewClient({ scans, user, todayCount }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isPro = user.plan === "pro";
  const remaining = Math.max(0, FREE_DAILY_LIMIT - todayCount);
  const limitReached = !isPro && remaining === 0;

  const [pendingUrl, setPendingUrl] = useState("");

  const completedScans = scans.filter((s) => s.status === "completed");
  const avgScore = completedScans.length
    ? Math.round(
        completedScans.reduce((a, b) => a + (b.score ?? 0), 0) /
          completedScans.length,
      )
    : null;


  async function handleScan() {
    setError("");
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL.");
      return;
    }
    const withProtocol = trimmed.startsWith("http")
      ? trimmed
      : `https://${trimmed}`;
    const domain = withProtocol.replace(/^https?:\/\//, "").split("/")[0];
    setLoading(true);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: withProtocol, domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "domain_not_verified") {
          setPendingUrl(withProtocol);
          setLoading(false);
          return;
        }
        if (data.error === "daily_limit_reached") {
          setError("You've used all 3 free scans today. Resets at midnight.");
        } else if (data.error === "domain_limit_reached") {
          setError("Free plan is limited to 1 domain. Upgrade to scan more.");
        } else {
          setError(data.message ?? "Something went wrong.");
        }
        setLoading(false);
        return;
      }
      setTimeout(() => {
        router.push(`/dashboard/scans/${data.scanId}`);
      }, 3000);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  const gradeColor = (grade: string | null) => {
    if (!grade) return "var(--muted)";
    if (grade === "A" || grade === "B") return "var(--safe)";
    if (grade === "C" || grade === "D") return "var(--caution)";
    return "var(--alert)";
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <>
      <style>{`
        .overview-page {
          padding: 32px 40px;
          max-width: 860px;
          /* extra top padding handled by layout on mobile */
        }
        .overview-stats-row {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
        }
        .overview-input-row {
          display: flex;
          border: 1.5px solid var(--ink);
          max-width: 560px;
        }
        .overview-scan-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: white;
          border: 1px solid var(--border);
          cursor: pointer;
        }
        .overview-scan-domain {
          font-size: 14px;
          font-weight: 500;
          font-family: 'Space Grotesk', sans-serif;
          word-break: break-all;
        }
        @media (max-width: 768px) {
          .overview-page {
            padding: 20px 16px;
            padding-top: 72px; /* 52px topbar + 20px breathing room */
          }
          .overview-stats-row {
            flex-direction: column;
            gap: 8px;
          }
          .overview-input-row {
            max-width: 100%;
          }
          .overview-scan-row {
            flex-wrap: wrap;
            gap: 8px;
          }
        }
      `}</style>

      <div className="overview-page">
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.heading}>
            Good {getTimeOfDay()}, {user.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p style={styles.subheading}>
            {isPro
              ? "You're on the Pro plan. Unlimited scans."
              : `${remaining} of ${FREE_DAILY_LIMIT} free scans remaining today.`}
          </p>
        </div>

        {/* Stats */}
        <div className="overview-stats-row">
          <StatCard
            label="Total Scans"
            value={String(scans.length)}
            sub="all time"
          />
          <StatCard
            label="Avg Score"
            value={avgScore !== null ? `${avgScore}` : "—"}
            sub="completed scans"
            valueColor={
              avgScore === null
                ? undefined
                : avgScore >= 75
                  ? "var(--safe)"
                  : avgScore >= 45
                    ? "var(--caution)"
                    : "var(--alert)"
            }
          />
          <StatCard
            label="Scans Today"
            value={`${todayCount}${!isPro ? `/${FREE_DAILY_LIMIT}` : ""}`}
            sub={isPro ? "unlimited" : `${remaining} remaining`}
          />
        </div>

        {/* Scan input */}
        <div style={styles.section}>
          <p style={styles.sectionLabel}>NEW SCAN</p>
          <div
            className="overview-input-row"
            style={{
              opacity: limitReached ? 0.5 : 1,
              pointerEvents: limitReached ? "none" : "auto",
            }}
          >
            <input
              style={styles.input}
              type="text"
              placeholder="https://yourapp.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              disabled={loading || limitReached}
            />
            <button
              style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
              onClick={handleScan}
              disabled={loading || limitReached}
            >
              {loading ? "Starting..." : "Scan now"}
            </button>
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
        </div>

        {/* Recent scans */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <p style={styles.sectionLabel}>RECENT SCANS</p>
            {scans.length > 0 && (
              <Link style={styles.viewAllBtn} href="/dashboard/scans">
                View all →
              </Link>
            )}
          </div>

          {scans.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                No scans yet — paste a URL above to get started.
              </p>
            </div>
          ) : (
            <div style={styles.scanList}>
              {scans.map((scan) => (
                <div
                  key={scan.scanId}
                  className="overview-scan-row"
                  style={{
                    cursor: scan.status === "completed" ? "pointer" : "default",
                  }}
                  onClick={() =>
                    scan.status === "completed" &&
                    router.push(`/dashboard/scans/${scan.scanId}`)
                  }
                >
                  <div style={styles.scanLeft}>
                    <div
                      style={{
                        ...styles.gradeBox,
                        color: gradeColor(scan.grade),
                        borderColor: scan.grade
                          ? gradeColor(scan.grade)
                          : "var(--border)",
                      }}
                    >
                      {scan.grade ?? "—"}
                    </div>
                    <div>
                      <p className="overview-scan-domain">{scan.domain}</p>
                      <p style={styles.scanDate}>
                        {formatDate(scan.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div style={styles.scanRight}>
                    {scan.score != null && (
                      <span style={styles.scanScore}>{scan.score}/100</span>
                    )}
                    <span
                      style={{
                        ...styles.statusPill,
                        background:
                          scan.status === "completed"
                            ? "#D4EDDA"
                            : scan.status === "failed"
                              ? "#F8D7DA"
                              : "#FFF3CD",
                        color:
                          scan.status === "completed"
                            ? "#155724"
                            : scan.status === "failed"
                              ? "#721C24"
                              : "#856404",
                      }}
                    >
                      {scan.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div style={statStyles.card}>
      <p style={statStyles.label}>{label}</p>
      <p style={{ ...statStyles.value, color: valueColor ?? "var(--ink)" }}>
        {value}
      </p>
      <p style={statStyles.sub}>{sub}</p>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const statStyles: Record<string, React.CSSProperties> = {
  card: {
    flex: 1,
    background: "white",
    border: "1px solid var(--border)",
    padding: "20px",
  },
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "var(--muted)",
    letterSpacing: "0.08em",
    marginBottom: "8px",
  },
  value: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: 1,
    marginBottom: "4px",
  },
  sub: {
    fontSize: "11px",
    color: "var(--muted)",
    fontFamily: "'Inter', sans-serif",
  },
};

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: "28px" },
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
  section: { marginBottom: "32px" },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  sectionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "var(--muted)",
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },
  viewAllBtn: {
    background: "none",
    border: "none",
    fontSize: "12px",
    color: "var(--muted)",
    cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif",
    padding: 0,
  },
  input: {
    flex: 1,
    padding: "13px 16px",
    fontSize: "14px",
    border: "none",
    outline: "none",
    background: "white",
    fontFamily: "'JetBrains Mono', monospace",
    color: "var(--ink)",
    minWidth: 0,
  },
  button: {
    padding: "13px 24px",
    background: "var(--ink)",
    color: "var(--paper)",
    border: "none",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: "pointer",
    flexShrink: 0,
  },
  errorText: { color: "var(--alert)", fontSize: "13px", marginTop: "10px" },
  emptyState: { padding: "32px 0", borderTop: "1px solid var(--border)" },
  scanList: { display: "flex", flexDirection: "column" as const, gap: "2px" },
  scanLeft: { display: "flex", alignItems: "center", gap: "14px" },
  gradeBox: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "16px",
    fontWeight: 600,
    border: "1.5px solid",
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scanDate: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "var(--muted)",
    marginTop: "2px",
  },
  scanRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  scanScore: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    color: "var(--muted)",
  },
  statusPill: {
    fontSize: "11px",
    padding: "2px 8px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    borderRadius: "2px",
  },
};
