# Developer Quickstart — gtcx-infrastructure

Get local infrastructure running and understand the repo in under 10 minutes.

---

## Fastest Path: Start Local Services

```bash
# Clone
git clone https://github.com/gtcx/gtcx-infrastructure
cd gtcx-infrastructure

# Install Node dependencies
pnpm install

# Start all local infrastructure services
docker compose -f infra/docker/docker-compose.infra.yml up -d

# Confirm everything is up
docker compose -f infra/docker/docker-compose.infra.yml ps
```

That gives you two PostgreSQL instances, Redis, Prometheus, Grafana, Jaeger, and Loki — the full local observability and data stack.

---

## What This Repo Manages

`gtcx-infrastructure` owns all deployment, IaC, and operational tooling for the GTCX ecosystem. It contains no application logic. It orchestrates, deploys, and operates services from other repos.

```
infra/
  docker/          Docker images + Compose configs for local and test environments
  kubernetes/      K8s manifests organized with Kustomize (base + per-env overlays)
  terraform/       AWS IaC modules — VPC, dual RDS (operational + audit)
  migrations/      Rails-based database migration stack
  security/        Security policies, access control, incident response, scanner
  scripts/         deploy.sh, migrate.sh, seed.sh, setup.sh
  edge-proxy/      Edge proxy configuration
```

---

## First Workflow: Run a Terraform Plan

Before changing any live infrastructure, always run a plan:

```bash
# Navigate to the environment you want to inspect
cd infra/terraform/environments/{env}

# Initialize (first time only)
terraform init

# View what would change — never apply without reviewing this
terraform plan
```

No automated apply runs without human review. See [ci-cd.md](../../2-docs/4-devops/3-ci-cd-pipelines/ci-cd.md) for the full approval gate.

---

## First Workflow: Apply a Kubernetes Change

```bash
# Lint manifests
pnpm lint

# Preview what would change (dry run)
kubectl diff -k infra/kubernetes/overlays/development

# Apply to development namespace
kubectl apply -k infra/kubernetes/overlays/development

# Staging and production require human approval — use deploy.sh
./infra/scripts/deploy.sh staging
./infra/scripts/deploy.sh production --approval-ticket=GTCX-123
```

---

## First Workflow: Run Database Migrations

```bash
# Development — autonomous, no approval required
./infra/scripts/migrate.sh development

# Staging — always dry-run first
./infra/scripts/migrate.sh staging --dry-run
./infra/scripts/migrate.sh staging

# Production — requires explicit approval
./infra/scripts/migrate.sh production --dry-run
# After review: ./infra/scripts/migrate.sh production
```

---

## Architecture Overview

- **Docker** — local dev and test environments; two base images (`Dockerfile.base` for Ruby/Rust, `Dockerfile.node` for Node.js services)
- **Kubernetes (Kustomize)** — three overlays: `development`, `staging`, `production`; five services: `api`, `crypto`, `tradepass`, `geotag`, `gci`
- **Terraform** — two modules: `vpc/` (network isolation) and `database/` (dual RDS — operational + audit); per-environment directories under `environments/`
- **Migrations** — Rails-based; config per environment in `migrations/config/`; never touch the audit DB
- **Security** — policies in `security/policies/`; scanner at `security/scripts/security-status.js`; audit reports in `security/reports/`

Two databases are a hard constraint. They are never merged:

| Instance       | Port | DB Name            | User         | Purpose                  |
| -------------- | ---- | ------------------ | ------------ | ------------------------ |
| postgres       | 5432 | `gtcx_development` | `gtcx`       | Application read/write   |
| postgres-audit | 5433 | `gtcx_audit`       | `gtcx_audit` | Append-only audit events |

---

## Local Service URLs

| Service    | URL                    |
| ---------- | ---------------------- |
| Grafana    | http://localhost:3030  |
| Prometheus | http://localhost:9090  |
| Jaeger UI  | http://localhost:16686 |
| Loki       | http://localhost:3100  |

---

## Essential References

- [service-overview.md](service-overview.md) — what this repo manages and why
- [developer-setup.md](developer-setup.md) — full prerequisites and environment setup
- [system-overview.md](../../2-docs/1-architecture/system-overview.md) — complete infrastructure architecture
- [deploy runbook](../../2-docs/4-operations/runbooks/deploy.md) — step-by-step deployment
- [migrate runbook](../../2-docs/4-operations/runbooks/migrate.md) — migration discipline
- [safety-rules.md](../4-workflows/safety-rules.md) — what requires human approval

---

## Need Help?

- GitHub Issues: https://github.com/gtcx/gtcx-infrastructure/issues
- Security contact: security@gtcx.io
- Infrastructure on-call: see `_sop/2-docs/4-operations/runbooks/incident-response.md`
