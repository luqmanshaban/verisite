# Verisite

Verisite scans a website and generates a security report, flagging missing or misconfigured HTTP security headers and other common web security issues.

## How it works

Verisite is a monorepo with two apps:

- **`apps/scanner`** — Go service that performs the actual scan: fetches a target site, inspects its HTTP security headers and configuration, and detects common misconfigurations.
- **`apps/web`** — Next.js frontend where users submit a URL and view the generated report.

## What gets checked

The scanner currently focuses on common web security headers and misconfigurations, including things like:

- Missing or weak security headers (e.g. `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`)
- Other common HTTP-level misconfigurations

## Project structure

```
apps/
├── scanner/   # Go scanning engine
└── web/       # Next.js frontend
```

## Getting started

### Scanner (Go)

```bash
cd apps/scanner/cmd/
go run .
```

### Web (Next.js)

```bash
cd apps/web
bun install
bun dev
```

## Status

Verisite is under active development.

## License

TBD
