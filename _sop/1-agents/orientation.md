# Codebase Orientation — gtcx-infrastructure

Session-start protocol for any agent or team member entering this repo.

---

## What This Repo Is

`gtcx-infrastructure` is the deployment, IaC, and operational tooling layer for the entire GTCX ecosystem. It owns:

- Docker images and Compose configurations for local development and CI
- Kubernetes manifests (Kustomize base + environment overlays) for all deployed services
- Terraform modules for cloud infrastructure (VPC, database, networking)
- Database migration tooling and configuration
- Security scanning, policies, and access control
- Deployment, migration, and seed scripts
- Edge proxy configuration

This repo has no application logic. It orchestrates, deploys, and operates the services defined in other repos. Changes here affect live infrastructure across development, staging, and production environments.

---

## Read Before Touching Anything

In this order:

1. `_sop/1-agents/safety-rules.md` — what requires human approval before any action
2. `_sop/2-docs/1-architecture/system-overview.md` — full infra stack, environment topology, K8s namespace model
3. `_sop/2-docs/4-operations/runbooks/deploy.md` — deploy process before touching `infra/scripts/deploy.sh`
4. For Terraform changes: `_sop/2-docs/1-architecture/` — understand what modules are shared before modifying
5. For migration changes: `_sop/2-docs/4-operations/runbooks/migrate.md` — migration discipline

---

## Repository Structure

```
infra/
  docker/                 Docker images and Compose configs
    Dockerfile.base         Shared base image
    Dockerfile.node         Node.js application image
    docker-compose.dev.yml  Application services (requires source code)
    docker-compose.infra.yml  Infrastructure services only (DBs, observability)
    docker-compose.test.yml   Test environment
    init-scripts/           Database init scripts (postgres, postgres-audit)
    observability/          Prometheus, Loki, Grafana configs
  kubernetes/             K8s manifests (Kustomize)
    base/                   Shared base resources — namespace, configmaps, services
    overlays/
      development/          Dev overrides
      staging/              Staging overrides
      production/           Production — ingress, network policies, pod security
  terraform/              Infrastructure as Code
    modules/
      vpc/                  Multi-cloud VPC / network isolation
      database/             PostgreSQL (operational + audit)
    environments/
      template/             Copy and fill per deployment environment
  migrations/             Database migration stack (MABA/KORA/AMANI config)
    config/                 Per-environment YAML config
    scripts/                Migration utilities (check_docs.py, generate_docs.py)
  security/               Security posture
    policies/               Access control, data protection, incident response
    scripts/                security-status.js scanner
    reports/                Audit reports
  scripts/                Operational scripts
    deploy.sh               Production deployment (canary, rollback)
    migrate.sh              Database migration runner
    seed.sh                 Data seeding
    setup.sh                Environment bootstrap
  edge-proxy/             Edge proxy configuration
_sop/                     Standard operating procedures (all docs live here)
```

---

## Environments

| Environment   | Namespace         | Usage                                                   |
| ------------- | ----------------- | ------------------------------------------------------- |
| `development` | `gtcx-dev`        | Local K8s, feature development                          |
| `staging`     | `gtcx-staging`    | Integration testing, pre-prod validation                |
| `production`  | `gtcx-production` | Live — requires `--approval-ticket=GTCX-XXX` for deploy |

---

## Key Commands

```bash
# Local infrastructure (databases + observability only)
docker compose -f infra/docker/docker-compose.infra.yml up -d

# Full local dev (application + infrastructure)
docker compose -f infra/docker/docker-compose.dev.yml up -d

# Deploy to environment (staging)
./infra/scripts/deploy.sh staging

# Deploy to production (requires ticket)
./infra/scripts/deploy.sh production --approval-ticket=GTCX-123

# Rollback production
./infra/scripts/deploy.sh production --rollback

# Run migrations
./infra/scripts/migrate.sh <environment>

# Lint and typecheck scripts
pnpm lint && pnpm typecheck
```

---

## Critical Rules

- Never run `./infra/scripts/deploy.sh production` without an `--approval-ticket` — the script enforces this, but confirm before running
- Never run `terraform apply` or `kubectl apply` directly — use the deploy script or get explicit human instruction
- Never hardcode secrets — all secrets via environment variables or secret manager
- The production overlay (`kubernetes/overlays/production/`) has network policies and pod security — do not bypass
- Two separate PostgreSQL databases: `gtcx_development` (operational, port 5432) and `gtcx_audit` (append-only audit, port 5433) — never merge or cross-write

---

## Security-Sensitive Areas

These require the Infrastructure Security Engineer role and human review before any change ships:

- `infra/security/` — policies and scanner
- `infra/kubernetes/overlays/production/network-policies.yaml`
- `infra/kubernetes/overlays/production/pod-security-policy.yaml`
- `infra/terraform/modules/database/` — database security config, encryption, access
- Any change to secret management or secret rotation
- `.github/workflows/` — CI/CD pipeline changes

---

## Where Things Live

| Need                  | Location                                        |
| --------------------- | ----------------------------------------------- |
| Deploy process        | `_sop/2-docs/4-operations/runbooks/deploy.md`   |
| Migration process     | `_sop/2-docs/4-operations/runbooks/migrate.md`  |
| Architecture overview | `_sop/2-docs/1-architecture/system-overview.md` |
| Security policies     | `infra/security/policies/`                      |
| K8s base config       | `infra/kubernetes/base/`                        |
| Terraform modules     | `infra/terraform/modules/`                      |
| Safety rules          | `_sop/1-agents/safety-rules.md`                 |
