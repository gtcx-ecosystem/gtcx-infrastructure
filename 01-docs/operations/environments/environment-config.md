---
title: 'Environment Configuration — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'testing', 'frontend']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Environment Configuration — gtcx-infrastructure

---

## 1. Environment Topology

| Environment             | K8s Namespace     | Purpose                                           | Audience         | Promotion                                  |
| ----------------------- | ----------------- | ------------------------------------------------- | ---------------- | ------------------------------------------ |
| **Local**               | (Docker Compose)  | Developer workstation — databases + observability | Engineers        | Manual                                     |
| **Development** (`dev`) | `gtcx-dev`        | Integration testing, feature branches             | Engineering team | Auto on merge to `develop`                 |
| **Staging** (`staging`) | `gtcx-staging`    | Pre-release validation, QA sign-off               | Engineering + QA | Auto on merge to `staging`                 |
| **Production** (`prod`) | `gtcx-production` | Live traffic — all GTCX services                  | All users        | Manual promotion, approval ticket required |

### Environment Parity

- Staging mirrors production infrastructure (same RDS instance class, same Terraform module configuration, same K8s overlay structure)
- Differences between staging and production: data (anonymized in staging), traffic scale, external integrations (sandbox accounts in staging)
- All environment-specific differences are captured in the Terraform `environments/{env}/terraform.tfvars` file and the K8s `overlays/{env}/` directory

---

## 2. Infrastructure Configuration per Environment

### Kubernetes Overlays

Each environment has a Kustomize overlay at `04-ship/kubernetes/overlays/{env}/`:

| Overlay       | Image Strategy      | Resource Limits | Security Additions                                                  |
| ------------- | ------------------- | --------------- | ------------------------------------------------------------------- |
| `development` | Local image tags    | Minimal         | None                                                                |
| `staging`     | Staging registry    | Standard        | Staging DB endpoints                                                |
| `production`  | Production registry | Production      | Ingress, network policies (deny-all), pod security policy (no root) |

### Terraform Variables

Each environment directory (`04-ship/terraform/environments/{env}/`) is a copy of `environments/template/`. Fill in `terraform.tfvars` with environment-specific values before running `terraform plan`.

### Database Sizing

| Environment | Operational DB                                    | Audit DB                        | Multi-AZ |
| ----------- | ------------------------------------------------- | ------------------------------- | -------- |
| Dev (local) | Docker postgres:16                                | Docker postgres:16              | No       |
| Staging     | RDS PostgreSQL 16.1                               | RDS PostgreSQL 16.1             | Yes      |
| Production  | RDS PostgreSQL 16.1 (100GB gp3, auto-scale 200GB) | RDS PostgreSQL 16.1 (200GB gp3) | Yes      |

---

## 3. Configuration Profiles

### Kubernetes ConfigMap Keys

The base configmap (`04-ship/kubernetes/base/configmaps/base-config.yaml`) provides:

| Key               | Value (base)  | Override in overlay? |
| ----------------- | ------------- | -------------------- |
| `GTCX_VERSION`    | Set per build | Yes — per overlay    |
| `GTCX_LOG_LEVEL`  | `info`        | Dev: `debug`         |
| `GTCX_LOG_FORMAT` | `json`        | No                   |

### Environment Variables for Scripts

Scripts in `04-ship/03-platform/scripts/` and the Node TypeScript tooling use:

| Variable       | Description                            | Dev              | Staging              | Production              |
| -------------- | -------------------------------------- | ---------------- | -------------------- | ----------------------- |
| `NODE_ENV`     | Runtime environment                    | `development`    | `staging`            | `production`            |
| `DATABASE_URL` | Operational database connection string | `localhost:5432` | Staging RDS endpoint | Production RDS endpoint |
| `AUDIT_DB_URL` | Audit database connection string       | `localhost:5433` | Staging audit RDS    | Production audit RDS    |
| `REDIS_URL`    | Redis connection                       | `localhost:6379` | Staging Redis        | Production Redis        |
| `LOG_LEVEL`    | Log verbosity                          | `debug`          | `info`               | `warn`                  |

All production and staging connection strings come from AWS Secrets Manager — never hardcoded.

---

## 4. Secrets Management

### Rules

- Secrets are never stored in git, `.env` files, or Terraform state in plaintext
- All database credentials are managed by AWS Secrets Manager (`manage_master_user_password = true` in the Terraform database module)
- Kubernetes secrets (`gtcx-secrets`) hold `DATABASE_URL` and `SECRET_KEY_BASE` — base contains placeholders; overlays must override before deployment
- Service accounts have access only to the secrets they need (least-privilege)
- Secret rotation: high-privilege credentials every 90 days; standard every 180 days

### Local Development

For local development, engineers use the Docker Compose init scripts which create the local databases with default credentials:

```bash
# Local PostgreSQL credentials (Docker Compose — not secret)
# Operational DB:  user=gtcx, password=gtcx, db=gtcx_development, port=5432
# Audit DB:        user=gtcx_audit, password=gtcx_audit, db=gtcx_audit, port=5433
```

These credentials are local-only and never used outside Docker Compose.

### Adding a New Secret (Staging/Production)

1. Add the secret to AWS Secrets Manager in the target environment
2. Grant access to the relevant IAM role / K8s service account
3. Reference the secret in the appropriate Terraform module or K8s overlay
4. Document in this file (variable name + description, not value)
5. Never commit the secret value anywhere

---

## 5. Access Control per Environment

| Environment | Engineer      | Senior Engineer | On-Call                       | Admin |
| ----------- | ------------- | --------------- | ----------------------------- | ----- |
| Local       | Full          | Full            | Full                          | Full  |
| Dev         | Full          | Full            | Full                          | Full  |
| Staging     | Deploy + read | Deploy + read   | Full                          | Full  |
| Production  | Read-only     | Read-only       | Write (audited, time-limited) | Full  |

Production write access for on-call engineers is time-limited (expires after 4 hours) and fully audited in the append-only audit database.

Production deployments require an approval ticket (`--approval-ticket=GTCX-NNN`). The `deploy.sh` script enforces this.

---

## 6. Environment Setup

### First-Time Local Setup

```bash
# Clone repo
git clone https://github.com/gtcx-ecosystem/gtcx-infrastructure
cd gtcx-infrastructure

# Install Node dependencies
pnpm install

# Start local infrastructure services
docker compose -f 04-ship/docker/docker-compose.infra.yml up -d

# Verify all services are running
docker compose -f 04-ship/docker/docker-compose.infra.yml ps
```

### New Environment (Staging/Production)

```bash
# Copy the Terraform environment template
cp -r 04-ship/terraform/environments/template 04-ship/terraform/environments/{env}

# Fill in environment-specific variables
vi 04-ship/terraform/environments/{env}/terraform.tfvars

# Initialize and plan (never apply without reviewing the plan)
cd 04-ship/terraform/environments/{env}
terraform init
terraform plan

# After human review of the plan:
terraform apply
```

### Applying K8s Changes to a New Environment

```bash
# Create the overlay directory if it doesn't exist
mkdir -p 04-ship/kubernetes/overlays/{env}

# Verify what would change before applying
kubectl diff -k 04-ship/kubernetes/overlays/{env}

# Apply (development only — autonomous)
kubectl apply -k 04-ship/kubernetes/overlays/development

# Staging and production use deploy.sh
./04-ship/03-platform/scripts/deploy.sh staging
./04-ship/03-platform/scripts/deploy.sh production --approval-ticket=GTCX-NNN
```

### Environment Health Checks

| Environment | Check                                                           | Expected             |
| ----------- | --------------------------------------------------------------- | -------------------- |
| Local       | `docker compose ps` (all containers)                            | All healthy          |
| Local       | `psql -h localhost -U gtcx -d gtcx_development -c "SELECT 1"`   | `1`                  |
| Staging     | `kubectl get pods -n gtcx-staging`                              | All Running          |
| Production  | `kubectl get pods -n gtcx-production`                           | All Running          |
| Any         | `node 03-platform/tools/03-platform/scripts/security-status.js` | No critical findings |

---

_Environment configuration is the foundation of reliable infrastructure delivery. Staging-production parity prevents surprises. The two-database constraint is non-negotiable._
