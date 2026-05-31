---
title: 'Executive Summary — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'compliance', 'infrastructure', 'frontend', 'backend']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Executive Summary — gtcx-infrastructure

---

## Product Vision

`gtcx-infrastructure` is the deployment and operations backbone for the GTCX ecosystem — the single source of truth for how every GTCX service is provisioned, deployed, and secured. It holds Terraform modules for AWS resource provisioning, Kubernetes manifests with Kustomize overlays per environment, GitHub Actions CI/CD pipelines, database migration tooling, and security policies. Its purpose is environment parity and operational consistency: a service that passes CI on `gtcx-dev` deploys to `gtcx-production` through the same manifests, the same gates, and the same secrets management pattern.

---

## Problem Statement

- **Deployment patterns diverge without a central repo:** each GTCX service left to manage its own K8s manifests and Terraform state will drift — different resource naming, different secret injection patterns, incompatible IAM policies that create security gaps
- **Environment parity breaks without enforced overlays:** without Kustomize overlays governed from a single source, dev/staging/production diverge and "works in dev, fails in prod" becomes the default failure mode
- **Database schema evolution has no coordination layer:** a distributed schema migration approach (each service runs its own migrations independently) causes ordering conflicts and rollback failures during multi-service deployments
- **Security scan and Terraform plan gates are per-repo without a central policy:** security controls applied inconsistently across repos create audit risk and compliance gaps for the GTCX platform

---

## Solution

Terraform modules provision AWS resources (EKS, RDS, ElastiCache, S3, IAM) with shared naming conventions and output contracts that Kustomize overlays consume. Three Kustomize overlay stacks (`gtcx-dev`, `gtcx-staging`, `gtcx-production`) provide per-environment configuration — resource limits, replica counts, secrets references — on top of a shared base. All GTCX backend services are deployed through ArgoCD GitOps pulling from this repo. GitHub Actions pipelines enforce Terraform plan review before apply, Trivy security scans before merge, and migration dry-run validation before deployment. The two-database pattern (PostgreSQL for transactional workloads, TimescaleDB for time-series event data) is standardized here.

| Layer              | Technology         | Role                                              |
| ------------------ | ------------------ | ------------------------------------------------- |
| Cloud provisioning | Terraform + AWS    | EKS, RDS, ElastiCache, S3, IAM                    |
| K8s configuration  | Kustomize overlays | Per-environment base + patch                      |
| GitOps delivery    | ArgoCD             | Continuous deployment from this repo              |
| CI/CD pipelines    | GitHub Actions     | Terraform gate, security scan, migration validate |
| Transactional DB   | PostgreSQL (RDS)   | All GTCX service operational data                 |
| Time-series DB     | TimescaleDB        | Trade event streams, metric history               |
| Migration tooling  | Custom + Flyway    | Schema evolution coordination across services     |

---

## Current Status

**Phase**: Active operations — all GTCX backend services deployed through this repo

**What is live:**

- Terraform modules for all GTCX AWS resources
- Kustomize overlays for dev, staging, and production environments
- ArgoCD GitOps configuration for all GTCX backend services
- GitHub Actions: Terraform plan/apply gate, Trivy security scan, migration dry-run
- Two-database pattern (PostgreSQL + TimescaleDB) live in all environments
- `ci-cd.md` with full pipeline documentation

**In progress:**

- Observability stack expansion (OpenTelemetry collectors, Grafana dashboards)
- Database migration coordination tooling for multi-service deployments
- Cost tagging enforcement across all Terraform modules
- Secrets rotation automation (AWS Secrets Manager)

---

## Key Metrics / Gates

| Gate                                                 | Target                          |
| ---------------------------------------------------- | ------------------------------- |
| Terraform plan review required before apply          | Enforced in CI — no exceptions  |
| Trivy security scan pass                             | Required for merge to main      |
| Migration dry-run pass before deployment             | Required for all schema changes |
| Environment parity (dev → staging → production diff) | < 5% configuration delta        |
| ArgoCD sync health (all services)                    | 100% — alerts on drift          |
| RDS backup retention                                 | 30 days minimum                 |

---

## References

- [Execution Roadmap (canonical)](../audit/execution-roadmap.md)
- [Product Backlog](backlog.md)
- [Sprint Planning](sprint-planning.md)
