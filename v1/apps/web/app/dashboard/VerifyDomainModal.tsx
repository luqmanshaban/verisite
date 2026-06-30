"use client";

import { useState } from "react";

interface Props {
  domain: string;
  token: string;
  isThirdPartyHost: boolean;
  onVerified: () => void;
  onCancel: () => void;
}

export default function VerifyDomainModal({
  domain,
  token,
  isThirdPartyHost,
  onVerified,
  onCancel,
}: Props) {
  const availableMethods: ("dns" | "file" | "meta")[] = isThirdPartyHost
    ? ["meta", "file"]
    : ["dns", "file", "meta"];

  const [method, setMethod] = useState<"dns" | "file" | "meta">(availableMethods[0]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify() {
    setError("");
    setChecking(true);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, method }),
      });
      const data = await res.json();
      if (data.verified) {
        onVerified();
      } else {
        const messages = {
          dns: "TXT record not found yet. DNS changes can take a few minutes to propagate.",
          file: "Verification file not found at the expected path.",
          meta: "Meta tag not found on your homepage. Make sure it's in the <head> section.",
        };
        setError(messages[method]);
      }
    } catch {
      setError("Verification check failed. Try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Verify ownership of {domain}</h2>
          <p style={styles.subtitle}>
            {isThirdPartyHost
              ? "This looks like a third-party hosting platform. Use one of these methods to verify ownership."
              : "Prove you own this domain before we scan it. Choose a method below."}
          </p>
        </div>

        <div style={styles.tabs}>
          {availableMethods.includes("dns") && (
            <button
              style={{ ...styles.tab, ...(method === "dns" ? styles.tabActive : {}) }}
              onClick={() => setMethod("dns")}
            >
              DNS Record
            </button>
          )}
          {availableMethods.includes("meta") && (
            <button
              style={{ ...styles.tab, ...(method === "meta" ? styles.tabActive : {}) }}
              onClick={() => setMethod("meta")}
            >
              Meta Tag
            </button>
          )}
          {availableMethods.includes("file") && (
            <button
              style={{ ...styles.tab, ...(method === "file" ? styles.tabActive : {}) }}
              onClick={() => setMethod("file")}
            >
              File Upload
            </button>
          )}
        </div>

        {method === "dns" && (
          <div style={styles.instructionBox}>
            <p style={styles.instructionLabel}>Add this TXT record to your DNS:</p>
            <div style={styles.codeRow}>
              <span style={styles.codeLabel}>Type</span>
              <span style={styles.codeValue}>TXT</span>
            </div>
            <div style={styles.codeRow}>
              <span style={styles.codeLabel}>Name</span>
              <span style={styles.codeValue}>@</span>
            </div>
            <div style={styles.codeRow}>
              <span style={styles.codeLabel}>Value</span>
              <span style={styles.codeValue}>verisite-verify={token}</span>
            </div>
            <p style={styles.note}>
              DNS changes can take a few minutes up to an hour to propagate.
            </p>
          </div>
        )}

        {method === "meta" && (
          <div style={styles.instructionBox}>
            <p style={styles.instructionLabel}>
              Add this tag to your homepage&#39;s &lt;head&gt; section:
            </p>
            <div style={styles.codeBlock}>
              {`<meta name="verisite-verify" content="${token}" />`}
            </div>
            <p style={styles.note}>
              Works with any site builder, Next.js, Vercel, Render, or static
              hosting — just add it to your homepage HTML.
            </p>
          </div>
        )}

        {method === "file" && (
          <div style={styles.instructionBox}>
            <p style={styles.instructionLabel}>
              Create this file and upload it to your site:
            </p>
            <div style={styles.codeBlock}>
              <p style={{ fontWeight: 600, marginBottom: "6px" }}>
                Path: /.well-known/verisite-verify.txt
              </p>
              <p>Content: {token}</p>
            </div>
            <p style={styles.note}>
              The file must be publicly accessible at this exact path.
            </p>
          </div>
        )}

        {error && <p style={styles.errorText}>{error}</p>}

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            style={{ ...styles.verifyBtn, opacity: checking ? 0.7 : 1 }}
            onClick={handleVerify}
            disabled={checking}
          >
            {checking ? "Checking..." : "I've added it — Verify now"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(13,13,13,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "20px",
  },
  modal: {
    background: "white",
    maxWidth: "480px",
    width: "100%",
    border: "1px solid var(--border)",
    maxHeight: "90vh",
    overflowY: "auto" as const,
  },
  header: {
    padding: "24px 24px 16px",
    borderBottom: "1px solid var(--border)",
  },
  title: {
    fontSize: "18px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "13px",
    color: "var(--muted)",
    lineHeight: 1.5,
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid var(--border)",
  },
  tab: {
    flex: 1,
    padding: "12px",
    background: "var(--paper)",
    border: "none",
    borderBottom: "2px solid transparent",
    fontSize: "13px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    color: "var(--muted)",
    cursor: "pointer",
  },
  tabActive: {
    background: "white",
    color: "var(--ink)",
    borderBottom: "2px solid var(--ink)",
  },
  instructionBox: {
    padding: "20px 24px",
  },
  instructionLabel: {
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "12px",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  codeRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 12px",
    background: "var(--paper)",
    border: "1px solid var(--border)",
    marginBottom: "6px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
  },
  codeLabel: {
    color: "var(--muted)",
  },
  codeValue: {
    fontWeight: 600,
    wordBreak: "break-all" as const,
    textAlign: "right" as const,
  },
  codeBlock: {
    background: "var(--paper)",
    border: "1px solid var(--border)",
    padding: "12px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    lineHeight: 1.6,
    wordBreak: "break-all" as const,
  },
  note: {
    fontSize: "12px",
    color: "var(--muted)",
    marginTop: "10px",
  },
  errorText: {
    color: "var(--alert)",
    fontSize: "13px",
    padding: "0 24px",
    marginTop: "-8px",
    marginBottom: "12px",
  },
  actions: {
    display: "flex",
    gap: "10px",
    padding: "16px 24px 24px",
  },
  cancelBtn: {
    flex: 1,
    padding: "11px",
    background: "white",
    border: "1px solid var(--border)",
    fontSize: "13px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
  },
  verifyBtn: {
    flex: 2,
    padding: "11px",
    background: "var(--ink)",
    color: "var(--paper)",
    border: "none",
    fontSize: "13px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
  },
};