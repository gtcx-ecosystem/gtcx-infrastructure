---
title: 'Infrastructure Architecture — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Infrastructure Architecture — gtcx-infrastructure

**Repo type:** DevOps / IaC tooling (no application runtime)
**Primary languages:** HCL (Terraform), YAML (Kubernetes), TypeScript (scripts), Shell
**Last updated:** 2026-03-08

---

## Architecture Overview

`gtcx-infrastructure` is not a service — it is the operational substrate for all GTCX services. It provisions, configures, and operates the environments those services run in. The architecture is organized into five layers.

```
┌──────────────────────────────────────────────────────────────────────┐
│  CI/CD Layer (GitHub Actions)                                         │
│  Lint → Typecheck → Terraform fmt/validate → Plan → Approval → Apply │
├──────────────────────────────────────────────────────────────────────┤
│  Orchestration Layer (Kubernetes + Kustomize)                         │
│  base/ + overlays/development + staging + production                 │
├──────────────────────────────────────────────────────────────────────┤
│  IaC Layer (Terraform)                                                │
│  modules/vpc  modules/database  environments/{env}                   │
├──────────────────────────────────────────────────────────────────────┤
│  Container Layer (Docker)                                             │
│  Dockerfile.base (Ruby/Rust)  Dockerfile.node  Compose configs       │
├──────────────────────────────────────────────────────────────────────┤
│  Data Layer (PostgreSQL + Redis + Observability)                      │
│  postgres:5432 (app)  postgres-audit:5433 (audit-only)  redis:6379   │
│  prometheus:9090  grafana:3030  jaeger:16686  loki:3100              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Deployed Services Map

The Kubernetes base defines five GTCX services. These are runtime services from other repos deployed into GTCX namespaces:

```yaml
Services:
  api:
    Image: gtcx/api
    Source: Dockerfile.base (ruby-production target)
    Purpose: Primary API gateway

  crypto:
    Image: gtcx/protocols-crypto
    Source: Dockerfile.base (rust-production target)
    Purpose: Cryptographic operations (Ed25519, HSM interface)

  tradepass:
    Source: gtcx-protocols
    Purpose: TradePass DID and credential protocol

  geotag:
    Source: gtcx-protocols
    Purpose: GeoTag location verification protocol

  gci:
    Source: gtcx-protocols
    Purpose: GCI commodity integrity protocol
```

---

## Database Architecture

**Type:** PostgreSQL 16.1 (AWS RDS)
**Pattern:** Two-database — operational (read/write) and audit (append-only)
**Hosting:** AWS RDS, managed via Terraform `modules/database/`

### Two-Database Constraint

This is a hard architectural rule. The two instances are never merged and never cross-written:

| Instance    | Identifier               | Port | User         | DB Name            | Purpose                    |
| ----------- | ------------------------ | ---- | ------------ | ------------------ | -------------------------- |
| Operational | `gtcx-{env}-operational` | 5432 | `gtcx`       | `gtcx_development` | All application read/write |
| Audit       | `gtcx-{env}-audit`       | 5433 | `gtcx_audit` | `gtcx_audit`       | Append-only audit events   |

The audit instance has `deletion_protection = true` in Terraform for all environments — this is not conditional. `DROP` and `TRUNCATE` are never run against it.

### RDS Configuration per Environment

| Parameter                      | Value                       | Notes                               |
| ------------------------------ | --------------------------- | ----------------------------------- |
| Engine                         | PostgreSQL 16.1             |                                     |
| Storage (operational)          | 100GB gp3, auto-scale 200GB |                                     |
| Storage (audit)                | 200GB gp3                   |                                     |
| Backup retention (operational) | 30 days                     |                                     |
| Backup retention (audit)       | 90 days                     |                                     |
| `storage_encrypted`            | `true`                      | Always, all environments            |
| `publicly_accessible`          | `false`                     | Always                              |
| `multi_az`                     | `true`                      | Default; can override in dev        |
| `manage_master_user_password`  | `true`                      | Credentials via AWS Secrets Manager |
| SSL min version                | TLSv1.2                     |                                     |
| Logs enabled                   | postgresql, upgrade         |                                     |
| Performance Insights           | enabled                     |                                     |

---

## Kubernetes Architecture

### Base Resources (`infra/kubernetes/base/`)

- `namespace.yaml` — namespace definition
- `configmaps/base-config.yaml` — shared config (`GTCX_VERSION`, `GTCX_LOG_LEVEL=info`, `GTCX_LOG_FORMAT=json`)
- `services/api.yaml`, `services/protocols-crypto.yaml`, `services/tradepass.yaml`, `services/geotag.yaml`, `services/gci.yaml`

### Environment Overlays

| Overlay       | K8s Namespace     | Notable Additions                                                          |
| ------------- | ----------------- | -------------------------------------------------------------------------- |
| `development` | `gtcx-dev`        | Minimal overrides, local image tags                                        |
| `staging`     | `gtcx-staging`    | Staging resource limits, staging DB endpoints                              |
| `production`  | `gtcx-production` | Ingress, network policies (deny-all + explicit allow), pod security policy |

Production overlay is security-sensitive. `network-policies.yaml` enforces deny-all with explicit allow rules. `pod-security-policy.yaml` forbids root and privileged containers. Changes to the production overlay require human approval before apply.

### Secrets

The `gtcx-secrets` Kubernetes secret holds `DATABASE_URL` and `SECRET_KEY_BASE`. The base contains placeholders; overlays must override these before deployment. The secret must exist in the namespace before `kubectl apply`.

---

## Terraform Architecture

### Module: `infra/terraform/modules/vpc/`

Multi-cloud VPC and network isolation. Provides subnet definitions and security group foundations used by the database module and cluster networking.

### Module: `infra/terraform/modules/database/`

Provisions two RDS PostgreSQL 16.1 instances per environment with all security defaults enabled. Uses the `vpc/` module for network placement.

### Environments: `infra/terraform/environments/`

Each environment is a directory copy of `template/`. Engineers fill in environment-specific `terraform.tfvars`. No automated apply without human review of `terraform plan` output.

---

## Container Images

| Image                   | Dockerfile        | Build Target      | Used By                    |
| ----------------------- | ----------------- | ----------------- | -------------------------- |
| `gtcx/api`              | `Dockerfile.base` | `ruby-production` | `api` K8s service          |
| `gtcx/protocols-crypto` | `Dockerfile.base` | `rust-production` | `crypto` K8s service       |
| Node services           | `Dockerfile.node` | (single target)   | Node.js application images |

Image tags are managed per K8s overlay via `kustomize edit set image`.

### Compose Configs

| File                       | Compose Name | Purpose                             |
| -------------------------- | ------------ | ----------------------------------- |
| `docker-compose.infra.yml` | `gtcx-infra` | Local: DBs + observability only     |
| `docker-compose.dev.yml`   |              | Local: application + infrastructure |
| `docker-compose.test.yml`  |              | Isolated test environment           |

---

## Observability Stack

All local and remote observability services:

| Component  | Technology         | Port  | Role                      |
| ---------- | ------------------ | ----- | ------------------------- |
| Metrics    | Prometheus v2.48.0 | 9090  | Metrics collection        |
| Dashboards | Grafana 10.2.2     | 3030  | Visualization             |
| Tracing    | Jaeger 1.52        | 16686 | Distributed traces (OTLP) |
| Logs       | Loki 2.9.2         | 3100  | Log aggregation           |

Prometheus scrape configs and Grafana dashboard definitions live in `infra/docker/observability/`.

---

## Security Architecture

Security posture is managed through three components:

1. **Policies** (`infra/security/policies/`) — access control, data protection policy, incident response playbooks
2. **Scanner** (`tools/scripts/security-status.js`) — run manually and in CI; generates reports
3. **Reports** (`infra/security/reports/`) — audit reports, SOC2 evidence

CI gates include weekly container image scans and weekly `pnpm audit` dependency checks. Critical CVEs block release.

Refer to [`docs/compliance/soc2-evidence-pipeline.md`](../compliance/soc2-evidence-pipeline.md) for SOC2 evidence collection.

---

## Deployment Pipeline

```yaml
CI (every PR):
  - pnpm lint
  - pnpm typecheck
  - terraform fmt -check -recursive
  - terraform validate

Infra Change Pipeline:
  - terraform plan (output reviewed in PR — human required)
  - staging apply: human approval required
  - production apply: separate explicit human approval + approval ticket

K8s Change Pipeline:
  - kubectl diff (preview reviewed in PR)
  - staging: human approval before kubectl apply
  - production: human approval + --approval-ticket=GTCX-NNN

Scheduled:
  - Daily: terraform drift detection
  - Weekly: container image scan
  - Weekly: pnpm audit
```

---

## Key Performance Indicators

| Metric                    | Target   | Notes                                  |
| ------------------------- | -------- | -------------------------------------- |
| Deployment success rate   | > 99%    | Failed deploys roll back automatically |
| RTO (application)         | < 15 min | Via canary rollback in deploy.sh       |
| RPO (operational DB)      | < 5 min  | 30-day backup + Multi-AZ failover      |
| RPO (audit DB)            | < 1 min  | 90-day backup + Multi-AZ + append-only |
| Terraform drift detection | Daily    | Alert on any unplanned drift           |
| Security scan cadence     | Weekly   | Critical CVEs block next release       |

---

## Documentation References

- [system-overview.md](../architecture/system-overview.md) — full infrastructure map
- [trust-model.md](../architecture/trust-model.md) — zero-trust security zones
- [network-architecture.md](../architecture/network-architecture.md) — network topology and PANX transport
- [deploy runbook](../operations/runbooks/deploy.md) — deployment procedures
- [migrate runbook](../operations/runbooks/migrate.md) — migration discipline
- [ci-cd.md](../operations/ci-cd/ci-cd.md) — CI gates and pipeline
