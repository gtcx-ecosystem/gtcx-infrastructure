# Technology Stack — gtcx-infrastructure

**Last updated:** 2026-03-08

---

## Summary

`gtcx-infrastructure` is the infrastructure-as-code and DevOps layer for the GTCX ecosystem. It does not produce application code — it provisions cloud resources, defines Kubernetes workloads, packages Helm charts, and drives CI/CD pipelines. The primary tools are Terraform (cloud provisioning), Kubernetes + Kustomize (workload definitions), and GitHub Actions (CI/CD).

---

## Core Technologies

| Layer              | Technology     | Version | Purpose                                                            |
| ------------------ | -------------- | ------- | ------------------------------------------------------------------ |
| IaC                | Terraform      | 1.6+    | AWS resource provisioning (VPC, EKS, RDS, S3, IAM, ECR)            |
| Container platform | Kubernetes     | 1.28+   | Workload orchestration across dev / staging / production           |
| K8s overlay tool   | Kustomize      | 5.x     | Environment-specific overlay management (no Helm templating abuse) |
| Package manager    | Helm           | 3.x     | Third-party chart management (cert-manager, ArgoCD, ingress)       |
| Containers         | Docker         | 24+     | Application container images + local dev compose stack             |
| GitOps delivery    | ArgoCD         | 2.9+    | Continuous delivery — Git state drives cluster state               |
| CI/CD              | GitHub Actions | —       | Pipelines: Terraform plan gating, security scans, deployments      |
| Cloud              | AWS            | —       | EKS, RDS, S3, Secrets Manager, ECR, VPC, IAM                       |

---

## Cloud Platform (AWS)

| AWS Service     | Purpose                                                               |
| --------------- | --------------------------------------------------------------------- |
| EKS             | Managed Kubernetes cluster for all GTCX workloads                     |
| RDS PostgreSQL  | Transactional database (primary data store for all platform services) |
| TimescaleDB     | Time-series metrics database (on RDS with TimescaleDB extension)      |
| S3              | Object storage — evidence artifacts, backups, static assets           |
| ECR             | Container registry for all GTCX Docker images                         |
| Secrets Manager | Secret injection into pods at runtime                                 |
| VPC             | Network isolation per environment                                     |
| IAM             | Role-based access for CI/CD, pods (IRSA), and operators               |

**Two-database pattern:** PostgreSQL for all transactional workloads; TimescaleDB for time-series telemetry and metrics. No single database serves both purposes.

---

## Kubernetes Environments

Three namespaces, one per environment:

| Namespace         | Environment | Cluster access            |
| ----------------- | ----------- | ------------------------- |
| `gtcx-dev`        | Development | Engineers, CI bots        |
| `gtcx-staging`    | Staging     | CI/CD only after PR merge |
| `gtcx-production` | Production  | ArgoCD only (GitOps)      |

All environment differences are expressed as Kustomize overlays — no environment-specific code exists in application repos.

---

## Repository Structure

```
terraform/
├── modules/         # Reusable Terraform modules (vpc, eks, rds, s3, iam)
├── environments/
│   ├── dev/         # Dev environment root module
│   ├── staging/     # Staging environment root module
│   └── production/  # Production environment root module
└── shared/          # Shared data sources and provider config
kubernetes/
├── base/            # Shared Kustomize base manifests for all services
└── overlays/
    ├── dev/         # Dev overrides
    ├── staging/     # Staging overrides
    └── production/  # Production overrides
helm/
├── charts/          # Any custom Helm charts authored here
└── values/          # Environment-specific values for third-party charts
docker/
└── docker-compose.infra.yml  # Local dev infrastructure services
.github/
└── workflows/       # GitHub Actions CI/CD pipelines
```

---

## Terraform

All AWS resources are defined in Terraform. Key conventions:

- Every module has a `variables.tf`, `main.tf`, and `outputs.tf`
- Remote state is stored in S3 with DynamoDB locking
- `terraform plan` output is posted as a PR comment before any merge
- `terraform apply` is gated behind manual approval in the CI pipeline for staging and production
- No hardcoded credentials — secrets come from AWS Secrets Manager or environment variables in CI

```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

---

## GitHub Actions CI/CD

**Terraform pipeline (on PR to `main`):**

```
terraform fmt check → terraform validate → tfsec security scan → terraform plan → post plan as PR comment
```

**Terraform pipeline (on merge to `main`):**

```
terraform plan → manual approval gate → terraform apply → ArgoCD sync
```

**Security scans (every PR):**

```
tfsec (Terraform) → trivy (container images) → checkov (K8s manifests)
```

| CI Job        | Trigger       | What it runs                                  |
| ------------- | ------------- | --------------------------------------------- |
| `tf-validate` | Every PR      | `terraform fmt -check` + `terraform validate` |
| `tf-security` | Every PR      | `tfsec` — Terraform security lint             |
| `tf-plan`     | Every PR      | `terraform plan` output posted as PR comment  |
| `k8s-lint`    | Every PR      | `kubeval` + `checkov` on all manifests        |
| `image-scan`  | Every PR      | `trivy` container image vulnerability scan    |
| `tf-apply`    | Main + manual | `terraform apply` with manual approval gate   |
| `argocd-sync` | Post-apply    | ArgoCD sync to propagate new manifests        |

---

## Local Development

The Docker Compose file at `docker/docker-compose.infra.yml` provides a local replica of the production infrastructure stack for service development:

```bash
docker compose -f docker/docker-compose.infra.yml up -d
```

| Service     | Local Port | Notes                          |
| ----------- | ---------- | ------------------------------ |
| PostgreSQL  | :5432      | Primary transactional database |
| TimescaleDB | :5433      | Metrics and time-series data   |
| Redis       | :6379      | Cache and pub/sub              |
| MinIO       | :9000      | S3-compatible object storage   |

---

## GitOps with ArgoCD

Production deployments are GitOps-only. No `kubectl apply` commands are run manually in production.

- ArgoCD watches the `kubernetes/overlays/production/` path in this repo
- Any merged change to that path triggers an automatic sync
- Rollback = revert the Git commit + ArgoCD re-syncs
- ArgoCD UI is accessible to platform engineers for monitoring; write access is CI-only

---

## Security Conventions

- **IRSA (IAM Roles for Service Accounts):** Every pod has a dedicated IAM role with least-privilege permissions — no shared node IAM roles for application access
- **Secrets:** Never stored in Git. Injected at runtime from AWS Secrets Manager via the External Secrets Operator
- **Network policy:** Default-deny enforced in all namespaces; explicit allow rules per service
- **Image provenance:** All images must come from ECR; no `latest` tags in production manifests

---

## Reference

- [dev-setup.md](../dev-setup.md) — local setup and tool prerequisites
- [deployment.md](../4-deployment/deployment.md) — deployment runbook
- [ci-cd-pipelines/](../../4-devops/3-ci-cd-pipelines/) — full CI/CD pipeline documentation
- [runbooks/](../../4-devops/2-runbooks/) — operational runbooks
