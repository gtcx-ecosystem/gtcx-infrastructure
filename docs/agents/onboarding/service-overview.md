# Service Overview — gtcx-infrastructure

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

> Understand this repo in 5 minutes.

---

## What It Does

`gtcx-infrastructure` owns all deployment, IaC, and operational tooling for the GTCX ecosystem. It has no application logic of its own. It defines, provisions, and operates the environments in which all other GTCX services run — from local development databases to production Kubernetes clusters backed by AWS RDS.

---

## Architecture

**Where it fits:** Consumed by all other GTCX repos. Every service that runs in any GTCX environment is deployed through tooling that lives here.

```
  ┌───────────────────────────────────────────────────────────────────┐
  │  Other GTCX Repos (gtcx-protocols, gtcx-platforms, gtcx-core...)  │
  └───────────────────────────────────────────────────────────────────┘
                               │  deployed by
                               ▼
  ┌───────────────────────────────────────────────────────────────────┐
  │  gtcx-infrastructure                                               │
  │                                                                   │
  │  Terraform (AWS) → Kubernetes (Kustomize) → Docker images         │
  │  Migrations (Rails) → Security policies → Operational scripts     │
  └───────────────────────────────────────────────────────────────────┘
                               │  runs on
                               ▼
  ┌───────────────────────────────────────────────────────────────────┐
  │  AWS (RDS, VPC) + Kubernetes namespaces (gtcx-dev / staging / prod) │
  └───────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer           | Technology                                |
| --------------- | ----------------------------------------- |
| IaC             | Terraform >= 1.6                          |
| Orchestration   | Kubernetes + Kustomize                    |
| Container build | Docker (Dockerfile.base, Dockerfile.node) |
| Local dev       | Docker Compose                            |
| CI/CD           | GitHub Actions                            |
| Cloud           | AWS (RDS PostgreSQL 16.1, VPC)            |
| Migrations      | Rails migration stack                     |
| Observability   | Prometheus, Grafana, Jaeger, Loki         |
| Secrets         | AWS Secrets Manager                       |
| Languages       | TypeScript (scripts), Shell, HCL, YAML    |

---

## Key Concepts

| Term                 | Definition                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two-database pattern | Operational DB (read/write) and audit DB (append-only) are always separate instances. Never merged, never cross-written.                            |
| Kustomize overlay    | Per-environment Kubernetes config. `base/` holds shared resources; `overlays/development`, `overlays/staging`, `overlays/production` override them. |
| Terraform module     | Reusable IaC unit. Two modules: `vpc/` and `database/`. Each environment copies the `template/` directory and fills in variables.                   |
| Approval ticket      | Production deployments require `--approval-ticket=GTCX-NNN`. No automated applies to production without a ticket.                                   |
| Terraform drift      | Daily scheduled check detects when live state diverges from declared IaC. Alerts are escalated to the infrastructure role.                          |

---

## Directory Structure

```
gtcx-infrastructure/
├── infra/
│   ├── docker/                   # Docker images and Compose configs
│   │   ├── Dockerfile.base       # Ruby + Rust production targets
│   │   ├── Dockerfile.node       # Node.js application image
│   │   ├── docker-compose.infra.yml  # Local: DBs + observability
│   │   ├── docker-compose.dev.yml    # Local: application services
│   │   ├── docker-compose.test.yml   # Test environment
│   │   ├── init-scripts/         # DB initialization SQL
│   │   └── observability/        # Prometheus, Loki, Grafana config
│   ├── kubernetes/               # K8s manifests (Kustomize)
│   │   ├── base/                 # Namespace, configmaps, services
│   │   └── overlays/
│   │       ├── development/
│   │       ├── staging/
│   │       └── production/       # Ingress, network policies, pod security
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── vpc/              # Multi-cloud VPC / network isolation
│   │   │   └── database/         # Dual RDS PostgreSQL 16.1
│   │   └── environments/
│   │       └── template/         # Copy per deployment environment
│   ├── migrations/               # Rails migration stack
│   │   ├── config/               # Per-environment YAML config
│   │   └── scripts/              # check_docs.py, generate_docs.py
│   ├── security/
│   │   ├── policies/             # Access control, data protection, IR
│   │   ├── scripts/              # security-status.js
│   │   └── reports/              # Audit reports
│   ├── scripts/
│   │   ├── deploy.sh             # Production deployment (canary, rollback)
│   │   ├── migrate.sh            # Migration runner
│   │   ├── seed.sh               # Data seeding
│   │   └── setup.sh              # Environment bootstrap
│   └── edge-proxy/               # Edge proxy configuration
├── tools/                        # Additional operational scripts
├── docs/                         # Docs, agent team, architecture, security
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── turbo.json
```

---

## Key Files

| File                                        | Purpose                                                    |
| ------------------------------------------- | ---------------------------------------------------------- |
| `infra/docker/docker-compose.infra.yml`     | Local infrastructure services — start here first           |
| `infra/kubernetes/base/`                    | Shared K8s resources for all environments                  |
| `infra/kubernetes/overlays/production/`     | Production-specific manifests — changes require approval   |
| `infra/terraform/modules/database/`         | Dual RDS provisioning with deletion protection on audit DB |
| `infra/terraform/environments/template/`    | Scaffold for new environments                              |
| `infra/scripts/deploy.sh`                   | Canonical deployment entry point                           |
| `infra/scripts/migrate.sh`                  | Migration runner with dry-run and environment guards       |
| `infra/security/scripts/security-status.js` | Security posture scanner                                   |

---

## Data Flow

```
1. Engineer commits infrastructure change (Terraform, K8s manifest, migration)
2. GitHub Actions runs CI gates: lint, typecheck, terraform fmt -check, terraform validate
3. Terraform plan is generated and attached to the PR for human review
4. On merge to main: staging changes are applied automatically; production requires explicit human approval
5. deploy.sh executes kubectl apply or terraform apply with canary/rollback support
6. Migrations run via migrate.sh — always dry-run first on staging and production
7. Security scanner runs weekly; drift detection runs daily and alerts on divergence
```

---

## Dependencies

**This repo depends on:**

| Dependency     | Type              | Purpose                                   |
| -------------- | ----------------- | ----------------------------------------- |
| AWS (RDS, VPC) | External Cloud    | Production and staging database + network |
| Docker Hub     | External Registry | Base images for builds                    |
| GitHub Actions | CI Platform       | Pipeline execution                        |

**What depends on this repo:**

| Consumer          | How It Connects                           |
| ----------------- | ----------------------------------------- |
| gtcx-protocols    | Deployed into K8s namespaces defined here |
| gtcx-platforms    | Deployed into K8s namespaces defined here |
| gtcx-core         | Database provisioned by Terraform here    |
| All GTCX services | Observability stack provided by this repo |

---

## Environments

| Environment   | K8s Namespace     | Usage                                    |
| ------------- | ----------------- | ---------------------------------------- |
| `development` | `gtcx-dev`        | Local K8s, feature development           |
| `staging`     | `gtcx-staging`    | Integration testing, pre-prod validation |
| `production`  | `gtcx-production` | Live — requires `--approval-ticket`      |

---

## Running Locally

```bash
# Start infrastructure services
docker compose -f infra/docker/docker-compose.infra.yml up -d

# Services available at:
# PostgreSQL (app)    localhost:5432
# PostgreSQL (audit)  localhost:5433
# Grafana             http://localhost:3030
# Prometheus          http://localhost:9090
# Jaeger              http://localhost:16686
```

For full setup instructions, see [developer-setup.md](developer-setup.md).
