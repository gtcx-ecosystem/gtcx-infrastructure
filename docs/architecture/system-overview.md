# System Overview — gtcx-infrastructure

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

`gtcx-infrastructure` owns all deployment, IaC, and operational tooling for the GTCX ecosystem. It has no application logic. It orchestrates, deploys, and operates the services defined in other repos.

**Compliance boundary:** `gtcx-infrastructure` also owns platform-level compliance (SOC 2, pen-test, shared policies). Service repos inherit platform compliance and only maintain application-layer controls. See [`platform-compliance-governance.md`](../compliance/platform-compliance-governance.md).

---

## Full Stack

```
infra/
  docker/                   Docker images and Compose configs
    Dockerfile.platforms      Platform service image (AGX and related apps)
    Dockerfile.protocols      Unified protocols service image
    Dockerfile.intelligence   Intelligence SDK image
    Dockerfile.node           Node.js application image
    docker-compose.infra.yml  Infrastructure services only (DBs, observability)
    docker-compose.dev.yml    Application services (requires source code)
    docker-compose.test.yml   Test environment
    init-scripts/             Database init SQL (postgres/, postgres-audit/)
    observability/            Prometheus, Loki, Grafana configs
  kubernetes/               K8s manifests (Kustomize)
    base/                     Shared base — namespace, configmaps, services
    overlays/
      development/            Dev overrides
      staging/                Staging overrides
      production/             Production — ingress, network policies, pod security
  terraform/                Infrastructure as Code
    modules/
      vpc/                    Multi-cloud VPC / network isolation
      database/               PostgreSQL (operational + audit) — RDS
    environments/
      template/               Copy and fill per deployment environment
  migrations/               Database migration stack (Rails)
    config/                   Per-environment YAML config
    scripts/                  Migration utilities (check_docs.py, generate_docs.py)
  security/                 Security posture
    policies/                 Access control, data protection, incident response
    scripts/                  security-status.js scanner
    reports/                  Audit reports
  scripts/                  Operational scripts
    deploy.sh                 Production deployment (canary, rollback)
    migrate.sh                Database migration runner
    seed.sh                   Data seeding
    setup.sh                  Environment bootstrap
  edge-proxy/               Edge proxy configuration
```

---

## Environments

| Environment   | K8s Namespace     | Usage                                    |
| ------------- | ----------------- | ---------------------------------------- |
| `development` | `gtcx-dev`        | Local K8s, feature development           |
| `staging`     | `gtcx-staging`    | Integration testing, pre-prod validation |
| `production`  | `gtcx-production` | Live — requires `--approval-ticket`      |

---

## Local Infrastructure Services

Defined in `infra/docker/docker-compose.infra.yml` (compose name: `gtcx-infra`):

| Service          | Image                         | Port(s)                                        | Purpose                    |
| ---------------- | ----------------------------- | ---------------------------------------------- | -------------------------- |
| `postgres`       | postgres:16-alpine            | 5432                                           | Operational database       |
| `postgres-audit` | postgres:16-alpine            | 5433                                           | Append-only audit database |
| `redis`          | redis:7-alpine                | 6379                                           | Cache, rate limiting       |
| `prometheus`     | prom/prometheus:v2.48.0       | 9090                                           | Metrics                    |
| `grafana`        | grafana/grafana:10.2.2        | 3030 (maps from 3000)                          | Dashboards                 |
| `jaeger`         | jaegertracing/all-in-one:1.52 | 16686 (UI), 4317 (OTLP gRPC), 4318 (OTLP HTTP) | Distributed tracing        |
| `loki`           | grafana/loki:2.9.2            | 3100                                           | Log aggregation            |

### Two-Database Architecture

This is a hard constraint — never merge, never cross-write:

| Instance         | DB Name            | Port | User         | Purpose                    |
| ---------------- | ------------------ | ---- | ------------ | -------------------------- |
| `postgres`       | `gtcx_development` | 5432 | `gtcx`       | All application read/write |
| `postgres-audit` | `gtcx_audit`       | 5433 | `gtcx_audit` | Append-only audit events   |

The audit database is write-once. `DROP` and `TRUNCATE` are never run against it. Deletion protection is always enabled (`deletion_protection = true` in Terraform regardless of environment).

---

## Kubernetes Architecture

### Base Resources (`infra/kubernetes/base/`)

- `namespace.yaml` — namespace definition
- `configmaps/base-config.yaml` — shared configuration
- `services/api.yaml` — AGX deployment and service
- `services/protocols.yaml` — unified protocols deployment and service
- `services/platform.yaml` — shared platform service account

ConfigMap keys: `GTCX_VERSION`, `GTCX_LOG_LEVEL` (info), `GTCX_LOG_FORMAT` (json)

Images managed in the main stack: `gtcx/agx`, `gtcx/protocols` — tags set per overlay via `kustomize edit set image`.

Secrets: `gtcx-secrets` (DATABASE_URL, SECRET_KEY_BASE) — base contains placeholders; overlays must override before deployment. The secret must exist in the namespace before `kubectl apply`.

Intelligence is deployed separately in `infra/kubernetes/overlays/production/intelligence` under the `intelligence` namespace.

### Environment Overlays

| Overlay       | Notable Additions                                               |
| ------------- | --------------------------------------------------------------- |
| `development` | Minimal overrides, local image tags                             |
| `staging`     | Staging-specific resource limits, staging DB endpoints          |
| `production`  | Ingress (`ingress.yaml`), network policies, pod security policy |

Production overlay is security-sensitive: `network-policies.yaml` (deny-all + explicit allow), `pod-security-policy.yaml` (no root, no privileged). Changes require human approval.

---

## Terraform Architecture

### Module: `infra/terraform/modules/database/`

Provisions two RDS PostgreSQL 16.1 instances per environment:

| Instance    | Identifier               | Storage   | Backup Retention | Notes                        |
| ----------- | ------------------------ | --------- | ---------------- | ---------------------------- |
| Operational | `gtcx-{env}-operational` | 100GB gp3 | 30 days          | Auto-scaling to 200GB        |
| Audit       | `gtcx-{env}-audit`       | 200GB gp3 | 90 days          | `deletion_protection = true` |

Security configuration:

- `storage_encrypted = true` — at-rest encryption always
- `publicly_accessible = false` — no public access
- `multi_az = true` (default) — high availability
- `manage_master_user_password = true` — credentials via AWS Secrets Manager
- SSL enforced (`ssl = 1`, `ssl_min_protocol_version = TLSv1.2`)
- CloudWatch logs: `postgresql`, `upgrade`
- Performance Insights enabled

### Module: `infra/terraform/modules/vpc/`

Multi-cloud VPC and network isolation. Used by the database module and cluster networking.

---

## Deployed Services

The main K8s overlays currently deploy:

- `gtcx-agx` — platform API service
- `gtcx-protocols` — unified protocol runtime

Production intelligence is managed separately:

- `anisa` — cultural intelligence service in the `intelligence` namespace
- `intelligence-sdk` — SDK/orchestration service in the `intelligence` namespace

---

## Key Commands

```bash
# Start local infrastructure only (databases + observability)
docker compose -f infra/docker/docker-compose.infra.yml up -d

# Start full local dev stack (application + infrastructure)
docker compose -f infra/docker/docker-compose.dev.yml up -d

# Deploy to staging
./infra/scripts/deploy.sh staging

# Deploy to production (requires ticket)
./infra/scripts/deploy.sh production --approval-ticket=GTCX-123

# Roll back production
./infra/scripts/deploy.sh production --rollback

# Run migrations (development only — autonomously)
./infra/scripts/migrate.sh development

# Run migrations with dry-run
./infra/scripts/migrate.sh staging --dry-run

# Terraform plan (read-only, requires human to apply)
cd infra/terraform/environments/{env} && terraform plan

# Security scan
node infra/security/scripts/security-status.js

# Lint and typecheck scripts
pnpm lint && pnpm typecheck
```

---

## Reference

- [`docs/agents/orientation.md`](../agents/onboarding/orientation.md) — session-start reading order
- [`docs/agents/safety-rules.md`](../agents/workflows/agent-safety-rules.md) — authority tiers
- [`docs/4-operations/runbooks/deploy.md`](../operations/runbooks/deploy.md) — deploy process
- [`docs/4-operations/runbooks/migrate.md`](../operations/runbooks/migrate.md) — migration discipline
