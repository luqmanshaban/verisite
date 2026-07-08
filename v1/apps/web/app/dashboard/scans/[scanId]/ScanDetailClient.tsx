"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Severity = "critical" | "warning" | "info";

interface CheckResult {
  module: string;
  check: string;
  passed: boolean;
  severity: Severity;
  title: string;
  description: string;
  fix: string;
}

interface ScanData {
  scanId: string;
  domain: string;
  url: string;
  status: string;
  score: number | null;
  grade: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

interface Props {
  scan: ScanData;
  results: CheckResult[];
}

export default function ScanDetailClient({ scan, results }: Props) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const gradeColor = (grade: string | null) => {
    if (!grade) return "var(--muted)";
    if (grade === "A" || grade === "B") return "var(--safe)";
    if (grade === "C" || grade === "D") return "var(--caution)";
    return "var(--alert)";
  };

  const severityColor = (severity: Severity) => {
    if (severity === "critical") return "var(--alert)";
    if (severity === "warning") return "var(--caution)";
    return "var(--muted)";
  };

  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/scans/${scan.scanId}/pdf`);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `verisite-report-${scan.domain}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Couldn't generate PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <style>{`
        .detail-page {
          padding: 32px 40px;
          max-width: 860px;
        }
        .detail-grade {
          font-family: 'JetBrains Mono', monospace;
          font-size: 72px;
          font-weight: 600;
          line-height: 1;
        }
        .detail-passed-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
        }
        .detail-result-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .detail-page {
            padding: 20px 16px;
            padding-top: 72px;
          }
          .detail-grade {
            font-size: 52px;
          }
          .detail-passed-grid {
            grid-template-columns: 1fr;
          }
          .detail-header-row {
            flex-wrap: wrap;
            gap: 12px;
          }
          .detail-pdf-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <div className="detail-page">
        {/* Header */}
        <div className="detail-header-row" style={styles.headerRow}>
          <button style={styles.backBtn} onClick={() => router.push("/dashboard/scans")}>
            ← Back to scans
          </button>
          <button
            className="detail-pdf-btn"
            style={{ ...styles.pdfBtn, opacity: downloading ? 0.6 : 1 }}
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? "Generating..." : "↓ Download PDF"}
          </button>
        </div>

        {/* Score hero */}
        <div style={styles.scoreSection}>
          <p style={styles.domainLabel}>{scan.domain}</p>
          <div style={styles.gradeWrapper}>
            <span className="detail-grade" style={{ color: gradeColor(scan.grade) }}>
              {scan.grade ?? "—"}
            </span>
            <span style={styles.scoreNumber}>
              {scan.score != null ? `${scan.score}/100` : "—/100"}
            </span>
          </div>
          <p style={styles.scanMeta}>
            {failed.length} issue{failed.length !== 1 ? "s" : ""} found · {passed.length} checks passed · Scanned {formatDate(scan.createdAt)}
          </p>
        </div>

        {/* Issues */}
        {failed.length > 0 && (
          <div style={styles.section}>
            <p style={styles.sectionLabel}>ISSUES TO FIX</p>
            <div style={styles.resultList}>
              {failed
                .sort((a, b) => {
                  const order = { critical: 0, warning: 1, info: 2 };
                  return order[a.severity] - order[b.severity];
                })
                .map((r) => (
                  <div key={r.check} style={styles.resultCard}>
                    <div className="detail-result-header">
                      <span style={{
                        ...styles.severityTag,
                        color: severityColor(r.severity),
                        borderColor: severityColor(r.severity),
                      }}>
                        {r.severity.toUpperCase()}
                      </span>
                      <span style={styles.resultTitle}>{r.title}</span>
                    </div>
                    {r.description && <p style={styles.resultDesc}>{r.description}</p>}
                    {r.fix && (
                      <div style={styles.fixBox}>
                        <span style={styles.fixLabel}>FIX →</span>
                        <p style={{ fontSize: "13px", marginTop: "4px" }}>{r.fix}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Passed */}
        {passed.length > 0 && (
          <div style={styles.section}>
            <p style={styles.sectionLabel}>PASSING CHECKS</p>
            <div className="detail-passed-grid">
              {passed.map((r) => (
                <div key={r.check} style={styles.passedItem}>
                  <span style={{ color: "var(--safe)", fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: "13px" }}>{r.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  backBtn: { background: "none", border: "none", fontSize: "13px", color: "var(--muted)", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", padding: 0 },
  pdfBtn: { padding: "9px 16px", background: "var(--ink)", color: "var(--paper)", border: "none", fontSize: "13px", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer" },
  scoreSection: { padding: "24px 0 32px", borderBottom: "1px solid var(--border)", marginBottom: "32px" },
  domainLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "var(--muted)", marginBottom: "12px", wordBreak: "break-all" },
  gradeWrapper: { display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" },
  scoreNumber: { fontFamily: "'JetBrains Mono', monospace", fontSize: "20px", color: "var(--muted)" },
  scanMeta: { fontSize: "13px", color: "var(--muted)", marginTop: "10px" },
  section: { marginBottom: "32px" },
  sectionLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "16px" },
  resultList: { display: "flex", flexDirection: "column" as const, gap: "12px" },
  resultCard: { border: "1px solid var(--border)", padding: "16px", background: "white" },
  severityTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", border: "1px solid", padding: "2px 6px", flexShrink: 0 },
  resultTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "14px" },
  resultDesc: { fontSize: "13px", color: "#444", lineHeight: 1.6, marginBottom: "12px" },
  fixBox: { background: "var(--paper)", border: "1px solid var(--border)", padding: "10px 12px", marginTop: "8px" },
  fixLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.06em" },
  passedItem: { display: "flex", alignItems: "center", gap: "8px" },
};