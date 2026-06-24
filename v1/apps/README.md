verisite/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── scans/
│   │   │   │       └── [scanId]/
│   │   │   │           └── page.tsx
│   │   │   ├── report/
│   │   │   │   └── [scanId]/
│   │   │   │       └── page.tsx  # public shareable report
│   │   │   └── api/
│   │   │       ├── auth/
│   │   │       │   └── [...nextauth]/
│   │   │       ├── scans/
│   │   │       │   ├── route.ts          # POST - submit scan
│   │   │       │   └── [scanId]/
│   │   │       │       ├── route.ts      # GET - scan status
│   │   │       │       └── stream/
│   │   │       │           └── route.ts  # GET - SSE stream
│   │   │       ├── domains/
│   │   │       │   └── verify/
│   │   │       │       └── route.ts      # POST - trigger verification
│   │   │       └── internal/
│   │   │           └── results/
│   │   │               └── route.ts      # POST - receives from Go
│   │   ├── components/
│   │   │   ├── scan-form.tsx
│   │   │   ├── report-card.tsx
│   │   │   ├── severity-badge.tsx
│   │   │   └── score-display.tsx
│   │   ├── lib/
│   │   │   ├── mongodb.ts
│   │   │   ├── auth.ts
│   │   │   └── scanner-client.ts   # HTTP client to Go API
│   │   └── models/
│   │       ├── scan.ts
│   │       └── result.ts
│   │
│   └── scanner/                # Go scan engine
│       ├── cmd/
│       │   └── main.go
│       ├── internal/
│       │   ├── api/
│       │   │   ├── handler.go      # HTTP handlers
│       │   │   └── middleware.go   # internal key auth
│       │   ├── scanner/
│       │   │   ├── scanner.go      # orchestrator
│       │   │   └── checks/
│       │   │       ├── headers.go
│       │   │       ├── exposure.go
│       │   │       ├── ratelimit.go
│       │   │       └── cookies.go
│       │   ├── models/
│       │   │   ├── scan.go
│       │   │   └── result.go
│       │   └── notifier/
│       │       └── notifier.go     # HTTP callbacks to Next.js
│       ├── go.mod
│       └── go.sum
│
├── packages/                   # shared types if needed later
├── docker-compose.yml          # local dev: mongo + go scanner
├── .env.example
└── README.md
