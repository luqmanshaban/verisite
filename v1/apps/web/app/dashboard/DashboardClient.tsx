"use client";

import { signOut } from "next-auth/react";
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
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function DashboardClient({ scans, user }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function extractDomain(url: string) {
    try {
      return new URL(url).hostname;
    } catch {
      return url.replace(/^https?:\/\//, "").split("/")[0];
    }
  }

  async function handleScan() {
    setError("");
    const trimmed = url.trim();
    if (!trimmed) { setError("Enter a URL."); return; }

    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const domain = extractDomain(withProtocol);

    setLoading(true);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: withProtocol, domain }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/report/${data.scanId}`);
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
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <main style={styles.main}>
      <nav style={styles.nav}>
        <span style={styles.logo}>VERISITE</span>
        <div style={styles.navRight}>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>
            {user.name ?? user.email}
          </span>
          <button style={styles.signOutBtn} onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </button>
        </div>
      </nav>

      {/* Scan input */}
      <section style={styles.scanSection}>
        <p style={{ ...styles.mono, fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "16px" }}>
          NEW SCAN
        </p>
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            type="text"
            placeholder="https://yourapp.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            disabled={loading}
          />
          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? "Starting..." : "Scan"}
          </button>
        </div>
        {error && <p style={{ color: "var(--alert)", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
      </section>

      {/* Scan history */}
      <section style={styles.section}>
        <p style={{ ...styles.mono, fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "20px" }}>
          SCAN HISTORY
        </p>

        {scans.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--muted)" }}>
            No scans yet. Paste a URL above to run your first scan.
          </p>
        ) : (
          <div style={styles.scanList}>
            {scans.map((scan) => (
              <div
                key={scan.scanId}
                style={styles.scanRow}
                onClick={() => router.push(`/report/${scan.scanId}`)}
              >
                <div style={styles.scanLeft}>
                  <span
                    style={{
                      ...styles.gradeBox,
                      color: gradeColor(scan.grade),
                      borderColor: gradeColor(scan.grade),
                    }}
                  >
                    {scan.grade ?? "—"}
                  </span>
                  <div>
                    <p style={styles.scanDomain}>{scan.domain}</p>
                    <p style={{ ...styles.mono, fontSize: "11px", color: "var(--muted)" }}>
                      {formatDate(scan.createdAt)}
                    </p>
                  </div>
                </div>
                <div style={styles.scanRight}>
                  {scan.score != null && (
                    <span style={{ ...styles.mono, fontSize: "13px", color: "var(--muted)" }}>
                      {scan.score}/100
                    </span>
                  )}
                  <span style={{
                    ...styles.statusPill,
                    background: scan.status === "completed" ? "#D4EDDA" : "#FFF3CD",
                    color: scan.status === "completed" ? "#155724" : "#856404",
                  }}>
                    {scan.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={styles.footer}>
        <span style={{ color: "var(--muted)", fontSize: "13px" }}>
          © 2026 Verisite
        </span>
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
    justifyContent: "space-between",
    padding: "24px 0",
    borderBottom: "1px solid var(--border)",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logo: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "15px",
    letterSpacing: "0.12em",
  },
  signOutBtn: {
    background: "none",
    border: "1px solid var(--border)",
    padding: "6px 12px",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif",
    color: "var(--muted)",
  },
  scanSection: {
    padding: "40px 0",
    borderBottom: "1px solid var(--border)",
  },
  inputRow: {
    display: "flex",
    border: "1.5px solid var(--ink)",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "14px",
    border: "none",
    outline: "none",
    background: "white",
    fontFamily: "'JetBrains Mono', monospace",
    color: "var(--ink)",
  },
  button: {
    padding: "12px 24px",
    background: "var(--ink)",
    color: "var(--paper)",
    border: "none",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: "0.02em",
    cursor: "pointer",
    flexShrink: 0,
  },
  section: {
    padding: "40px 0",
    borderBottom: "1px solid var(--border)",
  },
  scanList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  scanRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    background: "white",
    border: "1px solid var(--border)",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  scanLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  gradeBox: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "20px",
    fontWeight: 600,
    border: "1.5px solid",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scanDomain: {
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  scanRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statusPill: {
    fontSize: "11px",
    padding: "2px 8px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    borderRadius: "2px",
  },
  footer: {
    padding: "24px 0",
    marginTop: "auto",
  },
  mono: {
    fontFamily: "'JetBrains Mono', monospace",
  },
};