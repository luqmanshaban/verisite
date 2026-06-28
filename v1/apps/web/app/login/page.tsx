"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function LoginContent() {
  const searchParams = useSearchParams();
  const isVerify = searchParams.get("verify") === "1";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleMagicLink() {
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("resend", {
        email: trimmed,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (res?.error) throw new Error(res.error);
      setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isVerify || sent) {
    return (
      <main style={styles.main}>
        <nav style={styles.nav}>
          <Link href="/" style={styles.logo}>VERISITE</Link>
        </nav>
        <section style={styles.hero}>
          <div style={styles.checkmark}>✓</div>
          <h1 style={styles.headline}>Check your email</h1>
          <p style={styles.subtext}>
            We sent a sign-in link to{" "}
            <strong>{email || "your email"}</strong>.
            Click the link to continue — it expires in 10 minutes.
          </p>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "16px" }}>
            No email? Check your spam folder.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <nav style={styles.nav}>
        <Link href="/" style={styles.logo}>VERISITE</Link>
      </nav>

      <section style={styles.hero}>
        <h1 style={styles.headline}>Sign in to Verisite</h1>
        <p style={styles.subtext}>
          Save your scan history and monitor your sites over time.
        </p>

        {/* Magic link */}
        <div style={styles.card}>
          <p style={styles.cardLabel}>CONTINUE WITH EMAIL</p>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
              disabled={loading}
            />
          </div>
          {error && (
            <p style={{ color: "var(--alert)", fontSize: "13px", marginBottom: "12px" }}>
              {error}
            </p>
          )}
          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onClick={handleMagicLink}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* GitHub */}
        <button
          style={styles.githubButton}
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        >
          <svg
            height="18"
            width="18"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ flexShrink: 0 }}
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Continue with GitHub
        </button>

        <p style={styles.terms}>
          By signing in you agree to our{" "}
          <a href="/privacy" style={{ color: "var(--ink)", textDecoration: "underline" }}>
            privacy policy
          </a>
          .
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
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
  hero: {
    padding: "64px 0",
    maxWidth: "400px",
  },
  checkmark: {
    width: "48px",
    height: "48px",
    background: "var(--safe)",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "24px",
  },
  headline: {
    fontSize: "32px",
    letterSpacing: "-0.02em",
    marginBottom: "12px",
  },
  subtext: {
    fontSize: "15px",
    color: "#444",
    lineHeight: 1.6,
    marginBottom: "32px",
  },
  card: {
    border: "1.5px solid var(--border)",
    padding: "20px",
    background: "white",
    marginBottom: "20px",
  },
  cardLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "var(--muted)",
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },
  inputRow: {
    marginBottom: "12px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    border: "1.5px solid var(--border)",
    outline: "none",
    background: "var(--paper)",
    fontFamily: "'Inter', sans-serif",
    color: "var(--ink)",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "var(--ink)",
    color: "var(--paper)",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: "0.02em",
    cursor: "pointer",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "var(--border)",
  },
  dividerText: {
    fontSize: "12px",
    color: "var(--muted)",
    fontFamily: "'Inter', sans-serif",
  },
  githubButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "12px",
    background: "white",
    color: "var(--ink)",
    border: "1.5px solid var(--border)",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: "0.02em",
    cursor: "pointer",
    marginBottom: "20px",
  },
  terms: {
    fontSize: "12px",
    color: "var(--muted)",
    marginTop: "4px",
  },
};