"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url.replace(/^https?:\/\//, "").split("/")[0];
    }
  }

  async function handleScan() {
    setError("");
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL to scan.");
      return;
    }

    const withProtocol = trimmed.startsWith("http")
      ? trimmed
      : `https://${trimmed}`;
    const domain = extractDomain(withProtocol);

    setLoading(true);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: withProtocol, domain }),
      });

      if (!res.ok) throw new Error("Failed to start scan.");
      const data = await res.json();
      router.push(`/report/${data.scanId}`);
    } catch (e) {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <nav style={styles.nav}>
        <span style={styles.logo}>VERISITE</span>
        <span style={{ ...styles.mono, color: "var(--muted)", fontSize: "12px" }}>
          beta
        </span>
      </nav>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>
          <span style={styles.dot} />
          Security scanner for vibe-coded apps
        </div>

        <h1 style={styles.headline}>
          You shipped it.<br />
          But is it safe?
        </h1>

        <p style={styles.subtext}>
          Paste your URL. We run the same checks an attacker runs in the
          first 10 minutes — and explain every finding in plain English.
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
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? "Starting..." : "Scan now"}
          </button>
        </div>

        {error && <p style={styles.errorText}>{error}</p>}

        <p style={styles.hint}>
          Free scan · No account required · Results in under 30 seconds
        </p>
      </section>

      <section style={styles.checks}>
        <p style={{ ...styles.mono, fontSize: "11px", color: "var(--muted)", marginBottom: "16px", letterSpacing: "0.08em" }}>
          WHAT WE CHECK
        </p>
        <div style={styles.checkGrid}>
          {[
            "Security headers",
            "HTTPS enforcement",
            "Exposed config files",
            "Git repository leaks",
            "Admin panel exposure",
            "API documentation leaks",
            "Rate limiting",
            "Cookie security",
          ].map((item) => (
            <div key={item} style={styles.checkItem}>
              <span style={styles.checkDot}>✓</span> {item}
            </div>
          ))}
        </div>
      </section>

      <footer style={styles.footer}>
        <span style={{ color: "var(--muted)", fontSize: "13px" }}>
          © 2026 Verisite · Built for founders who ship fast
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
    gap: "8px",
    padding: "24px 0",
    borderBottom: "1px solid var(--border)",
  },
  logo: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "15px",
    letterSpacing: "0.12em",
  },
  hero: {
    padding: "80px 0 64px",
    borderBottom: "1px solid var(--border)",
  },
  eyebrow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "var(--muted)",
    marginBottom: "24px",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--safe)",
    display: "inline-block",
    flexShrink: 0,
  },
  headline: {
    fontSize: "clamp(36px, 6vw, 56px)",
    marginBottom: "20px",
    letterSpacing: "-0.02em",
  },
  subtext: {
    fontSize: "17px",
    color: "#444",
    lineHeight: 1.7,
    marginBottom: "40px",
    maxWidth: "520px",
  },
  inputRow: {
    display: "flex",
    gap: "0",
    marginBottom: "12px",
    border: "1.5px solid var(--ink)",
  },
  input: {
    flex: 1,
    padding: "14px 16px",
    fontSize: "15px",
    border: "none",
    outline: "none",
    background: "white",
    fontFamily: "'JetBrains Mono', monospace",
    color: "var(--ink)",
  },
  button: {
    padding: "14px 28px",
    background: "var(--ink)",
    color: "var(--paper)",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    transition: "opacity 0.15s",
    flexShrink: 0,
  },
  errorText: {
    color: "var(--alert)",
    fontSize: "13px",
    marginBottom: "8px",
  },
  hint: {
    fontSize: "12px",
    color: "var(--muted)",
    marginTop: "4px",
  },
  checks: {
    padding: "48px 0",
    borderBottom: "1px solid var(--border)",
  },
  checkGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 24px",
  },
  checkItem: {
    fontSize: "14px",
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  checkDot: {
    color: "var(--safe)",
    fontWeight: 700,
    fontSize: "13px",
  },
  footer: {
    padding: "24px 0",
    marginTop: "auto",
  },
  mono: {
    fontFamily: "'JetBrains Mono', monospace",
  },
};