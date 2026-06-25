"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Severity = "critical" | "warning" | "info";

interface CheckResult {
  scanId: string;
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
  status: string;
  score: number | null;
  grade: string | null;
  domain: string;
}

export default function ReportPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const [results, setResults] = useState<CheckResult[]>([]);
  const [scan, setScan] = useState<ScanData | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchScan() {
    try {
      const res = await fetch(`/api/scans/${scanId}`);
      const data = await res.json();

      setScan(data.scan);
      setResults(data.results ?? []);

      if (data.scan?.status !== "completed" && data.scan?.status !== "failed") {
        pollRef.current = setTimeout(fetchScan, 2000);
      }
    } catch {
      pollRef.current = setTimeout(fetchScan, 3000);
    }
  }
  
  useEffect(() => {
    fetchScan();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [scanId]);


  const gradeColor = (grade: string) => {
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
  const isRunning = !scan || scan.status === "pending" || scan.status === "running";

  return (
    <main style={styles.main}>
      <nav style={styles.nav}>
        <Link href="/" style={styles.logo}>VERISITE</Link>
      </nav>

      <section style={styles.scoreSection}>
        <div style={styles.scoreLeft}>
          <p style={{ ...styles.mono, fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "8px" }}>
            SECURITY SCORE
          </p>
          <div style={styles.gradeWrapper}>
            <span style={{
              ...styles.grade,
              color: scan?.grade ? gradeColor(scan.grade) : "var(--muted)",
            }}>
              {scan?.grade ?? "—"}
            </span>
            <span style={styles.scoreNumber}>
              {scan?.score != null ? `${scan.score}/100` : "—/100"}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "8px" }}>
            {isRunning
              ? "Scanning your site..."
              : `${failed.length} issue${failed.length !== 1 ? "s" : ""} found · ${passed.length} checks passed`}
          </p>
        </div>

        <div style={styles.scoreRight}>
          <p style={{ ...styles.mono, fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "12px" }}>
            SCAN ID
          </p>
          <p style={{ ...styles.mono, fontSize: "12px", wordBreak: "break-all" }}>
            {scanId}
          </p>
          <div style={{ marginTop: "16px" }}>
            <span style={{
              ...styles.statusBadge,
              background: isRunning ? "#FFF3CD" : scan?.status === "completed" ? "#D4EDDA" : "#F8D7DA",
              color: isRunning ? "#856404" : scan?.status === "completed" ? "#155724" : "#721C24",
            }}>
              {scan?.status ?? "pending"}
            </span>
          </div>
        </div>
      </section>

      {isRunning && (
        <section style={{ padding: "64px 0", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            Running security checks — this takes about 10 seconds...
          </p>
        </section>
      )}

      {!isRunning && failed.length > 0 && (
        <section style={styles.section}>
          <p style={styles.sectionLabel}>ISSUES TO FIX</p>
          <div style={styles.resultList}>
            {failed
              .sort((a, b) => {
                const order = { critical: 0, warning: 1, info: 2 };
                return order[a.severity] - order[b.severity];
              })
              .map((r) => (
                <div key={r.check} style={styles.resultCard}>
                  <div style={styles.resultHeader}>
                    <span style={{
                      ...styles.severityTag,
                      color: severityColor(r.severity),
                      borderColor: severityColor(r.severity),
                    }}>
                      {r.severity.toUpperCase()}
                    </span>
                    <span style={styles.resultTitle}>{r.title}</span>
                  </div>
                  {r.description && (
                    <p style={styles.resultDesc}>{r.description}</p>
                  )}
                  {r.fix && (
                    <div style={styles.fixBox}>
                      <span style={{ ...styles.mono, fontSize: "11px", color: "var(--muted)", letterSpacing: "0.06em" }}>
                        FIX →
                      </span>
                      <p style={{ fontSize: "13px", marginTop: "4px" }}>{r.fix}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {!isRunning && passed.length > 0 && (
        <section style={styles.section}>
          <p style={styles.sectionLabel}>PASSING CHECKS</p>
          <div style={styles.passedGrid}>
            {passed.map((r) => (
              <div key={r.check} style={styles.passedItem}>
                <span style={{ color: "var(--safe)", fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: "13px" }}>{r.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={styles.footer}>
        <Link href="/" style={{ fontSize: "13px", color: "var(--muted)" }}>
          ← Scan another URL
        </Link>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    maxWidth: "680px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    padding: "24px 0",
    borderBottom: "1px solid var(--border)",
  },
  logo: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "15px",
    letterSpacing: "0.12em",
  },
  scoreSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "48px 0 40px",
    borderBottom: "1px solid var(--border)",
  },
  scoreLeft: { flex: 1 },
  scoreRight: { textAlign: "right" as const },
  gradeWrapper: {
    display: "flex",
    alignItems: "baseline",
    gap: "16px",
  },
  grade: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "96px",
    fontWeight: 600,
    lineHeight: 1,
  },
  scoreNumber: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "24px",
    color: "var(--muted)",
  },
  statusBadge: {
    display: "inline-block",
    padding: "3px 10px",
    fontSize: "11px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    letterSpacing: "0.04em",
    borderRadius: "2px",
  },
  section: {
    padding: "40px 0",
    borderBottom: "1px solid var(--border)",
  },
  sectionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "var(--muted)",
    letterSpacing: "0.08em",
    marginBottom: "20px",
  },
  resultList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  resultCard: {
    border: "1px solid var(--border)",
    padding: "16px",
    background: "white",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  severityTag: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    border: "1px solid",
    padding: "2px 6px",
    flexShrink: 0,
  },
  resultTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    fontSize: "14px",
  },
  resultDesc: {
    fontSize: "13px",
    color: "#444",
    lineHeight: 1.6,
    marginBottom: "12px",
  },
  fixBox: {
    background: "var(--paper)",
    border: "1px solid var(--border)",
    padding: "10px 12px",
    marginTop: "8px",
  },
  passedGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 24px",
  },
  passedItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  footer: {
    padding: "32px 0",
    marginTop: "auto",
  },
  mono: {
    fontFamily: "'JetBrains Mono', monospace",
  },
};