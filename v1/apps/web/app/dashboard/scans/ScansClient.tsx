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
    <div style={styles.page}>
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
          <div style={styles.tableHeader}>
            <span style={{ flex: 2 }}>DOMAIN</span>
            <span style={{ flex: 1 }}>SCORE</span>
            <span style={{ flex: 1 }}>GRADE</span>
            <span style={{ flex: 1 }}>STATUS</span>
            <span style={{ flex: 1 }}>DATE</span>
          </div>
          {scans.map((scan) => (
            <div
              key={scan.scanId}
              style={{
                ...styles.tableRow,
                cursor: scan.status === "completed" ? "pointer" : "default",
                opacity: scan.status === "failed" ? 0.5 : 1,
              }}
              onClick={() =>
                scan.status === "completed" &&
                router.push(`/dashboard/scans/${scan.scanId}`)
              }
            >
              <span style={{ ...styles.cell, flex: 2, fontWeight: 500 }}>
                {scan.domain}
              </span>
              <span style={{ ...styles.cell, flex: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                {scan.score != null ? `${scan.score}/100` : "—"}
              </span>
              <span style={{
                ...styles.cell,
                flex: 1,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                color: gradeColor(scan.grade),
              }}>
                {scan.grade ?? "—"}
              </span>
              <span style={{ ...styles.cell, flex: 1 }}>
                <span style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "2px",
                  fontWeight: 600,
                  background:
                    scan.status === "completed" ? "#D4EDDA"
                    : scan.status === "failed" ? "#F8D7DA"
                    : "#FFF3CD",
                  color:
                    scan.status === "completed" ? "#155724"
                    : scan.status === "failed" ? "#721C24"
                    : "#856404",
                }}>
                  {scan.status}
                </span>
              </span>
              <span style={{
                ...styles.cell,
                flex: 1,
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--muted)",
                fontSize: "12px",
              }}>
                {formatDate(scan.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 40px",
    maxWidth: "860px",
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
  table: {
    border: "1px solid var(--border)",
    background: "white",
  },
  tableHeader: {
    display: "flex",
    padding: "10px 16px",
    borderBottom: "1px solid var(--border)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "var(--muted)",
    letterSpacing: "0.08em",
    background: "var(--paper)",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid var(--border)",
    transition: "background 0.1s",
  },
  cell: {
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },
};