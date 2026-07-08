"use client";

import { useRouter } from "next/navigation";

interface ScanItem {
  scanId: string;
  domain: string;
  url: string;
  status: string;
  score: number | null;
  grade: string | null;
  createdAt: string | null;
}

export default function ScansClient({ scans }: { scans: ScanItem[] }) {
  const router = useRouter();

  const gradeColor = (grade: string | null) => {
    if (!grade) return "var(--muted)";
    if (grade === "A" || grade === "B") return "var(--safe)";
    if (grade === "C" || grade === "D") return "var(--caution)";
    return "var(--alert)";
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <>
      <style>{`
        .scans-page {
          padding: 32px 40px;
          max-width: 860px;
        }
        .scans-table-header {
          display: flex;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 0.08em;
          background: var(--paper);
        }
        .scans-table-row {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          transition: background 0.1s;
        }
        .scans-col-domain { flex: 2; font-weight: 500; font-size: 13px; word-break: break-all; }
        .scans-col-score  { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .scans-col-grade  { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; }
        .scans-col-status { flex: 1; }
        .scans-col-date   { flex: 1; font-family: 'JetBrains Mono', monospace; color: var(--muted); font-size: 12px; }

        /* Mobile: hide table header, switch rows to card layout */
        @media (max-width: 768px) {
          .scans-page {
            padding: 20px 16px;
            padding-top: 72px;
          }
          .scans-table-header {
            display: none;
          }
          .scans-table-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 14px 16px;
          }
          .scans-col-domain { flex: none; font-size: 14px; }
          .scans-col-score  { flex: none; }
          .scans-col-grade  { flex: none; font-size: 16px; }
          .scans-col-status { flex: none; }
          .scans-col-date   { flex: none; }
          .scans-row-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="scans-page">
        <div style={styles.header}>
          <h1 style={styles.heading}>Scans</h1>
          <p style={styles.subheading}>{scans.length} total scans</p>
        </div>

        {scans.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            No scans yet. Go to Overview to run your first scan.
          </p>
        ) : (
          <div style={styles.table}>
            <div className="scans-table-header">
              <span style={{ flex: 2 }}>DOMAIN</span>
              <span style={{ flex: 1 }}>SCORE</span>
              <span style={{ flex: 1 }}>GRADE</span>
              <span style={{ flex: 1 }}>STATUS</span>
              <span style={{ flex: 1 }}>DATE</span>
            </div>

            {scans.map((scan) => {
              const statusBg = scan.status === "completed" ? "#D4EDDA" : scan.status === "failed" ? "#F8D7DA" : "#FFF3CD";
              const statusColor = scan.status === "completed" ? "#155724" : scan.status === "failed" ? "#721C24" : "#856404";
              const statusPill = (
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "2px", fontWeight: 600, background: statusBg, color: statusColor }}>
                  {scan.status}
                </span>
              );

              return (
                <div
                  key={scan.scanId}
                  className="scans-table-row"
                  style={{ cursor: scan.status === "completed" ? "pointer" : "default", opacity: scan.status === "failed" ? 0.5 : 1 }}
                  onClick={() => scan.status === "completed" && router.push(`/dashboard/scans/${scan.scanId}`)}
                >
                  {/* Desktop: flat columns */}
                  <span className="scans-col-domain" style={{ display: "var(--desktop-only, flex)" }}>
                    {scan.domain}
                  </span>
                  <span className="scans-col-score">{scan.score != null ? `${scan.score}/100` : "—"}</span>
                  <span className="scans-col-grade" style={{ color: gradeColor(scan.grade) }}>{scan.grade ?? "—"}</span>
                  <span className="scans-col-status">{statusPill}</span>
                  <span className="scans-col-date">{formatDate(scan.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: "28px" },
  heading: { fontSize: "24px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "4px" },
  subheading: { fontSize: "13px", color: "var(--muted)", fontFamily: "'Inter', sans-serif" },
  table: { border: "1px solid var(--border)", background: "white" },
};