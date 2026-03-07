# CLAUDE.md — GTCX Infrastructure (`4-infrastructure`)

## Purpose

All deployment, infrastructure-as-code, and operational tooling for the GTCX ecosystem. Docker, Kubernetes, Terraform, security scanning, database migrations, and CI/CD configurations.

## Commands

```bash
pnpm install        # Install Node tooling
pnpm lint           # Lint IaC and scripts
pnpm typecheck      # Type-check scripts
```

## Stack

- Docker + Docker Compose
- Kubernetes (manifests/helm)
- Terraform
- pnpm workspaces + Turborepo
- Node.js scripts for automation

## Agent Orientation

Read before touching anything:

1. `_sop/1-agents/orientation.md` — repo map, environment topology, key commands
2. `_sop/1-agents/safety-rules.md` — three-tier authority structure (Autonomous / Requires Approval / Never)

## Key Rules

- Never apply infrastructure changes to production without explicit confirmation and `--approval-ticket=GTCX-XXX`
- All secrets via environment variables or secret manager — never hardcoded
- Destructive operations (drop DB, delete cluster resources) require explicit user instruction
- IaC changes must be reviewed before `terraform apply` or `kubectl apply`
- Two separate PostgreSQL databases: `gtcx_development` (port 5432, operational) and `gtcx_audit` (port 5433, append-only) — never merge, never cross-write, never drop `gtcx_audit`
- Never modify a migration that has already run in any environment
