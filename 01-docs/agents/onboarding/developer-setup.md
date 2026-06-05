---
title: 'Developer Setup — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

> [!WARNING]
> **DEPRECATED — see [orientation.md](./orientation.md).**
> This document overlaps with the canonical onboarding path and is kept
> only so existing inbound links don't 404. New agents should start at
> orientation.md. Content here may drift; trust orientation.md when in doubt.

# Developer Setup — gtcx-infrastructure

---

## Prerequisites

| Tool           | Version    | Install                                                |
| -------------- | ---------- | ------------------------------------------------------ |
| Node.js        | >= 20.18.0 | https://nodejs.org or `nvm install 20.18.0`            |
| pnpm           | >= 9.15.0  | `npm install -g pnpm`                                  |
| Docker         | >= 24.0    | https://docs.docker.com/get-docker/                    |
| Docker Compose | >= 2.20    | Bundled with Docker Desktop                            |
| Terraform      | >= 1.6.0   | https://developer.hashicorp.com/terraform/downloads    |
| kubectl        | >= 1.28    | https://kubernetes.io/01-docs/tasks/03-platform/tools/ |
| AWS CLI        | >= 2.13    | `brew install awscli` or https://aws.amazon.com/cli    |

---

## Clone & Install

```bash
# 1. Clone the repository
git clone https://github.com/gtcx-ecosystem/gtcx-infrastructure
cd gtcx-infrastructure

# 2. Install Node dependencies
pnpm install

# 3. Verify the build
pnpm build

# 4. Run lint and typecheck
pnpm lint && pnpm typecheck
```

There is no `.env.example` at the repo root — environment configuration is managed per-infrastructure component. See `04-ship/terraform/environments/template/` for Terraform variable templates.

---

## Starting Local Infrastructure Services

All local backing services (databases, observability stack) are defined in `04-ship/docker/docker-compose.infra.yml`:

```bash
# Start infrastructure services only (PostgreSQL, Redis, Prometheus, Grafana, Jaeger, Loki)
docker compose -f 04-ship/docker/docker-compose.infra.yml up -d

# Verify all services are healthy
docker compose -f 04-ship/docker/docker-compose.infra.yml ps

# Start full local dev stack (application services + infrastructure)
docker compose -f 04-ship/docker/docker-compose.dev.yml up -d
```

| Service            | Port(s) | Credentials                          |
| ------------------ | ------- | ------------------------------------ |
| PostgreSQL (app)   | 5432    | user: `gtcx`, db: `gtcx_development` |
| PostgreSQL (audit) | 5433    | user: `gtcx_audit`, db: `gtcx_audit` |
| Redis              | 6379    | No auth (local)                      |
| Prometheus         | 9090    | No auth (local)                      |
| Grafana            | 3030    | admin / admin                        |
| Jaeger UI          | 16686   | No auth (local)                      |
| Loki               | 3100    | No auth (local)                      |

---

## Running Scripts

```bash
# Run all tests
pnpm test

# Lint and typecheck
pnpm lint
pnpm typecheck

# Run the security scanner
node 03-platform/tools/03-platform/scripts/security-status.js

# Bootstrap a new environment
./04-ship/03-platform/scripts/setup.sh

# Run database migrations (development — autonomous)
./04-ship/03-platform/scripts/migrate.sh development

# Run migrations with dry-run (staging/production — always dry-run first)
./04-ship/03-platform/scripts/migrate.sh staging --dry-run
```

---

## Environment Variables

This repo is IaC and tooling — it does not run a long-lived application process. Secrets for live environments are managed via AWS Secrets Manager (`manage_master_user_password = true` in Terraform). No secrets are committed to this repo.

For Terraform work, copy the environment template:

```bash
cp 04-ship/terraform/environments/template/ 04-ship/terraform/environments/my-env
# Edit terraform.tfvars with environment-specific values
```

---

## Common Issues

| Problem                                               | Cause                               | Solution                                                              |
| ----------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `docker compose up` fails on port 5432                | Local PostgreSQL already running    | Stop the local process: `brew services stop postgresql`               |
| `terraform plan` errors on provider authentication    | AWS credentials not configured      | Run `aws configure` or export `AWS_PROFILE`                           |
| `kubectl` commands return "connection refused"        | No cluster context set              | Run `aws eks update-kubeconfig --name <cluster-name>`                 |
| `pnpm install` fails with missing native deps         | Node version mismatch               | Use Node 20: `nvm use 20`                                             |
| Grafana at port 3030 shows no data                    | Prometheus not yet scraping targets | Wait 30s after startup, then reload dashboards                        |
| Migration script fails with "database does not exist" | Init scripts haven't run            | Recreate containers: `docker compose down -v && docker compose up -d` |

---

## IDE Setup

**Recommended editor:** VS Code or Cursor

**Extensions:**

- HashiCorp Terraform — syntax highlighting and validation for `.tf` files
- Kubernetes — YAML validation and kubectl integration
- Docker — Dockerfile and Compose support
- ESLint — linting integration
- Prettier — code formatting

**Settings:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[terraform]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.formatOnSave": true
  }
}
```

---

## Verification

Confirm your setup is working:

- [ ] Repository cloned and `pnpm install` ran without errors
- [ ] `pnpm build` passes
- [ ] `pnpm lint && pnpm typecheck` passes
- [ ] `docker compose -f 04-ship/docker/docker-compose.infra.yml up -d` starts all services
- [ ] `docker compose ps` shows all containers healthy
- [ ] PostgreSQL reachable on port 5432: `psql -h localhost -U gtcx -d gtcx_development`
- [ ] Grafana accessible at http://localhost:3030
- [ ] Jaeger UI accessible at http://localhost:16686
- [ ] `node 03-platform/tools/03-platform/scripts/security-status.js` runs without fatal errors
