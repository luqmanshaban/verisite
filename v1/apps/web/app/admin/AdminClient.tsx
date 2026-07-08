'use client'
import { useEffect, useState } from "react";

interface Scan {
  _id: string;
  scanId: string;
  url: string;
  domain: string;
  userId: string;
  status: string;
  score: number | null;
  grade: string | null;
  createdAt: string | null;
}

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
  recentUsers: {
    email: string;
    name: string;
    plan: string;
    createdAt: string | null;
  }[];
  recentScans: Scan[];
  topScanners: { _id: string; count: number }[];
}

type Tab = "overview" | "scans";

export default function AdminClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allScans, setAllScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scansLoading, setScansLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [scansPage, setScansPage] = useState(1);
  const [totalScans, setTotalScans] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const PAGE_SIZE = 25;

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "scans") return;
    setScansLoading(true);
    const params = new URLSearchParams({
      page: String(scansPage),
      limit: String(PAGE_SIZE),
      ...(filterStatus !== "all" && { status: filterStatus }),
      ...(filterType !== "all" && { type: filterType }),
    });
    fetch(`/api/admin/scans?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setAllScans(data.scans ?? []);
        setTotalScans(data.total ?? 0);
      })
      .finally(() => setScansLoading(false));
  }, [tab, scansPage, filterStatus, filterType]);

  if (loading)
    return (
      <div style={styles.page}>
        <p>Loading...</p>
      </div>
    );
  if (!stats)
    return (
      <div style={styles.page}>
        <p>Failed to load stats.</p>
      </div>
    );

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const gradeColor = (grade: string | null) => {
    if (!grade) return "var(--muted)";
    if (grade === "A") return "#2A9D8F";
    if (grade === "B") return "#57A87A";
    if (grade === "C") return "#F4A261";
    if (grade === "D") return "#E07B4A";
    return "#E63946";
  };

  const totalPages = Math.ceil(totalScans / PAGE_SIZE);

  return (
    <>
      <style>{`
        .admin-page {
          padding: 32px 40px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 32px;
        }
        .admin-signal-banner {
          display: flex;
          gap: 32px;
          background: #0D0D0D;
          color: white;
          padding: 20px 24px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .admin-list-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: white;
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .admin-list-truncate {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .admin-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 768px) {
          .admin-page {
            padding: 20px 16px;
            padding-top: 72px;
          }
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .admin-signal-banner {
            gap: 20px;
            padding: 16px;
          }
        }
      `}</style>

      <div className="admin-page">
        <h1 style={styles.heading}>Admin — Verisite</h1>

        <div className="admin-signal-banner">
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
          <div>
            <p style={styles.signalLabel}>LOGGED-IN SCANS</p>
            <p style={styles.signalValue}>{stats.totals.loggedInScans}</p>
          </div>
        </div>

        <div style={styles.tabs}>
          {(["overview", "scans"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            >
              {t === "overview"
                ? "OVERVIEW"
                : `ALL SCANS (${stats.totals.scans})`}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <div className="admin-stats-grid">
              <StatBox label="Total Users" value={stats.totals.users} />
              <StatBox
                label="Unique Scanners"
                value={stats.engagement.uniqueScanners}
              />
              <StatBox label="Total Scans" value={stats.totals.scans} />
              <StatBox label="Completed" value={stats.totals.completedScans} />
              <StatBox
                label="Anonymous Scans"
                value={stats.totals.anonymousScans}
              />
              <StatBox
                label="Logged-in Scans"
                value={stats.totals.loggedInScans}
              />
              <StatBox
                label="Verified Domains"
                value={stats.totals.verifiedDomains}
              />
              <StatBox
                label="Pending Domains"
                value={stats.totals.pendingDomains}
              />
            </div>

            <div style={styles.section}>
              <p style={styles.sectionLabel}>TOP SCANNERS</p>
              <div style={styles.list}>
                {stats.topScanners.map((u, i) => (
                  <div key={u._id} className="admin-list-row">
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "12px",
                        color: "var(--muted)",
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </span>
                    <span
                      className="admin-list-truncate"
                      style={{
                        fontSize: "13px",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {u._id}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {u.count} scans
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionLabel}>RECENT SIGNUPS</p>
              <div style={styles.list}>
                {stats.recentUsers.map((u) => (
                  <div key={u.email} className="admin-list-row">
                    <span
                      className="admin-list-truncate"
                      style={{ fontSize: "13px" }}
                    >
                      {u.email}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--muted)",
                        flexShrink: 0,
                      }}
                    >
                      {u.plan}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        fontFamily: "'JetBrains Mono', monospace",
                        flexShrink: 0,
                      }}
                    >
                      {formatDate(u.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionLabel}>RECENT SCANS</p>
              <ScansTable
                scans={stats.recentScans}
                formatDate={formatDate}
                gradeColor={gradeColor}
              />
            </div>
          </>
        )}

        {tab === "scans" && (
          <div style={styles.section}>
            <div style={styles.filters}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>STATUS</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setScansPage(1);
                  }}
                  style={styles.select}
                >
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>TYPE</label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setScansPage(1);
                  }}
                  style={styles.select}
                >
                  <option value="all">All</option>
                  <option value="anonymous">Anonymous</option>
                  <option value="user">Logged-in</option>
                </select>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  alignSelf: "flex-end",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {totalScans} total
              </p>
            </div>

            {scansLoading ? (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                Loading scans...
              </p>
            ) : (
              <>
                <ScansTable
                  scans={allScans}
                  formatDate={formatDate}
                  gradeColor={gradeColor}
                  showUrl
                />
                {totalPages > 1 && (
                  <div style={styles.pagination}>
                    <button
                      onClick={() => setScansPage((p) => Math.max(1, p - 1))}
                      disabled={scansPage === 1}
                      style={styles.pageBtn}
                    >
                      ← Prev
                    </button>
                    <span
                      style={{
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {scansPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setScansPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={scansPage === totalPages}
                      style={styles.pageBtn}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ScansTable({
  scans,
  formatDate,
  gradeColor,
  showUrl = false,
}: {
  scans: Scan[];
  formatDate: (iso: string | null) => string;
  gradeColor: (grade: string | null) => string;
  showUrl?: boolean;
}) {
  if (!scans.length)
    return <p style={{ fontSize: "13px", color: "var(--muted)" }}>No scans.</p>;

  return (
    <div className="admin-table-wrap">
      <table style={tableStyles.table}>
        <thead>
          <tr>
            {showUrl && <th style={tableStyles.th}>URL</th>}
            <th style={tableStyles.th}>DOMAIN</th>
            <th style={tableStyles.th}>TYPE</th>
            <th style={tableStyles.th}>GRADE</th>
            <th style={tableStyles.th}>SCORE</th>
            <th style={tableStyles.th}>STATUS</th>
            <th style={tableStyles.th}>DATE</th>
            <th style={tableStyles.th}>REPORT</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s, i) => (
            <tr
              key={s._id ?? i}
              style={i % 2 === 0 ? tableStyles.rowEven : tableStyles.rowOdd}
            >
              {showUrl && (
                <td style={tableStyles.td}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.url ?? s.domain}
                  </span>
                </td>
              )}
              <td style={tableStyles.td}>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.domain}
                </span>
              </td>
              <td style={tableStyles.td}>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 6px",
                    background:
                      s.userId === "anonymous" ? "#F0F0F0" : "#E8F4F8",
                    color: s.userId === "anonymous" ? "#666" : "#1A6A8A",
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.userId === "anonymous" ? "anon" : "user"}
                </span>
              </td>
              <td style={tableStyles.td}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: gradeColor(s.grade),
                  }}
                >
                  {s.grade ?? "—"}
                </span>
              </td>
              <td style={tableStyles.td}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px",
                  }}
                >
                  {s.score ?? "—"}
                </span>
              </td>
              <td style={tableStyles.td}>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 6px",
                    background:
                      s.status === "completed"
                        ? "#D4EDDA"
                        : s.status === "failed"
                          ? "#F8D7DA"
                          : "#FFF3CD",
                    color:
                      s.status === "completed"
                        ? "#155724"
                        : s.status === "failed"
                          ? "#721C24"
                          : "#856404",
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.status}
                </span>
              </td>
              <td
                style={{
                  ...tableStyles.td,
                  color: "var(--muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(s.createdAt)}
              </td>
              <td style={tableStyles.td}>
                {s.status === "completed" && s.scanId ? (
                  <a
                    href={`/report/${s.scanId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={tableStyles.reportLink}
                  >
                    View →
                  </a>
                ) : (
                  <span style={{ color: "var(--muted)", fontSize: "11px" }}>
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

const tableStyles: Record<string, React.CSSProperties> = {
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "var(--muted)",
    letterSpacing: "0.06em",
    borderBottom: "2px solid var(--border)",
    whiteSpace: "nowrap",
  },
  td: { padding: "10px 12px", verticalAlign: "middle" },
  rowEven: { background: "white", borderBottom: "1px solid var(--border)" },
  rowOdd: { background: "#FAFAF8", borderBottom: "1px solid var(--border)" },
  reportLink: {
    fontSize: "12px",
    fontFamily: "'JetBrains Mono', monospace",
    color: "#0D0D0D",
    textDecoration: "none",
    fontWeight: 600,
    borderBottom: "1px solid #0D0D0D",
    paddingBottom: "1px",
  },
};

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
  page: { padding: "32px 40px" },
  heading: {
    fontSize: "22px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    marginBottom: "24px",
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
  tabs: {
    display: "flex",
    marginBottom: "24px",
    borderBottom: "2px solid var(--border)",
  },
  tab: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    padding: "10px 20px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    letterSpacing: "0.06em",
    cursor: "pointer",
    color: "var(--muted)",
  },
  tabActive: { color: "#0D0D0D", borderBottom: "2px solid #0D0D0D" },
  section: { marginBottom: "28px" },
  sectionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "var(--muted)",
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },
  list: { display: "flex", flexDirection: "column" as const, gap: "2px" },
  filters: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-end",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  filterLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "var(--muted)",
    letterSpacing: "0.06em",
  },
  select: {
    border: "1px solid var(--border)",
    background: "white",
    padding: "6px 10px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    cursor: "pointer",
    outline: "none",
  },
  pagination: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "20px",
  },
  pageBtn: {
    border: "1px solid var(--border)",
    background: "white",
    padding: "6px 14px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    cursor: "pointer",
  },
};
