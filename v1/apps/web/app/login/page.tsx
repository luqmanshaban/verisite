"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
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

        <button
          style={styles.button}
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        >
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: "10px" }}>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Continue with GitHub
        </button>
      </section>
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
  hero: {
    padding: "80px 0",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: "20px",
  },
  headline: {
    fontSize: "36px",
    letterSpacing: "-0.02em",
  },
  subtext: {
    fontSize: "16px",
    color: "#444",
    lineHeight: 1.6,
  },
  button: {
    display: "flex",
    alignItems: "center",
    padding: "14px 24px",
    background: "var(--ink)",
    color: "var(--paper)",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: "0.02em",
    cursor: "pointer",
    marginTop: "8px",
  },
};