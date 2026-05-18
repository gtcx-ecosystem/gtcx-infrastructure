---
title: 'Implementation Truth — gtcx-infrastructure'
status: 'current'
date: '2026-05-12'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
---

# Implementation Truth — gtcx-infrastructure

**Date:** 2026-03-09
**Scope:** gtcx-infrastructure — directory-by-directory audit of what exists, what is deployable, and what breaks

---

## Root Structure

```
infra/
  docker/          — Compose files, Dockerfiles, observability configs
  kubernetes/      — K8s base + dev/staging/production overlays
  terraform/       — VPC module + database module only
  migrations/      — Migration tooling scripts (Python)
  scripts/         — Deployment, seed, setup, migrate shell scripts
  security/        — Policy documents and one security status script
  edge-proxy/      — README only, no implementation
tools/             — Scripts and templates subdirectories
```

---

## Docker Layer

### What Exists

- `Dockerfile.base` and `Dockerfile.node`: multi-stage Dockerfiles with named targets — `ruby-production`, `rust-production`, `edge-runtime`
- `docker-compose.dev.yml`: full dev stack — postgres (primary), postgres-audit (separate instance, per AUDITABLE principle), redis, api, crypto, tradepass, geotag, gci, crx, sgx, agx, edge node, plus the full observability stack (Prometheus 2.48, Grafana 10.2, Jaeger 1.52, Loki 2.9)
- `docker-compose.infra.yml`: infrastructure-only subset — postgres, postgres-audit, redis, observability — designed to run independently of application source code, all healthchecks defined
- `docker-compose.test.yml`: integration test environment
- `observability/`: prometheus.yml, loki.yml, Grafana datasource provisioning YAML — Grafana auto-provisions the Prometheus datasource on startup

### Production-Deployable Assessment

`docker-compose.infra.yml` is runnable immediately — all images are from public registries. This provides a working local observability stack and database layer for any developer.

`docker-compose.dev.yml` is **not runnable** without pre-built application images. The Dockerfiles reference build targets (`ruby-production`, `rust-production`) that build from application source code not present in this repo. The dev compose assumes a monorepo parent context.

### Key Gaps

- `edge-runtime` Dockerfile target is referenced in `docker-compose.dev.yml` but the `edge-proxy/` directory contains only a README. The edge node Dockerfile target is not implemented anywhere in the repo.
- No Dockerfile for Python services (ANISA, PANX) — the intelligence layer has no container definition here.
- No container registry configuration — no push targets, no registry credentials setup.
- Init-scripts directories referenced in compose (`./init-scripts/postgres`, `./init-scripts/postgres-audit`) do not exist in the repo — the postgres containers will start but without database schema initialization.

---

## Kubernetes Layer

### Base (Confirmed)

- `namespace.yaml`: declares the `gtcx` namespace
- `kustomization.yaml`: base kustomization wiring 5 service manifests — api, crypto, tradepass, geotag, gci
- `services/api.yaml`: complete manifest — Deployment (2 replicas, non-root, read-only root filesystem, all capabilities dropped) + ClusterIP Service + ServiceAccount + HPA (2–10 replicas, CPU 70% / memory 80%) + PodDisruptionBudget (minAvailable: 1) + Prometheus scrape annotations
- `services/protocols-crypto.yaml`, `tradepass.yaml`, `geotag.yaml`, `gci.yaml`: same pattern

### Overlays (Confirmed)

- `overlays/development/kustomization.yaml`: thin reference to base
- `overlays/staging/kustomization.yaml`: thin reference to base, no meaningful patches
- `overlays/production/kustomization.yaml`: references base + ingress + network policies + pod security policy
- `overlays/production/ingress.yaml`: NGINX Ingress for `api.gtcx.io` (TLS via cert-manager, rate limit 100 rps / 50 connections, full security headers CSP/XFO/XCTO) + internal ingress for tradepass/geotag/gci on `*.gtcx.internal`
- `overlays/production/network-policies.yaml`: default-deny ingress + default-deny egress (DNS exempted); per-service policies for api → crypto → protocol services → database at 10.0.0.0/8; crypto has no external egress at all
- `overlays/production/pod-security-policy.yaml`: non-root enforcement, read-only root filesystem

### Deployable If Prerequisites Met

The production K8s manifests are correct and well-structured. They will deploy successfully given:

1. Container images (`gtcx/api`, `gtcx/protocols-crypto`) exist in a registry accessible to the cluster
2. Secret `gtcx-secrets` pre-created in namespace with `DATABASE_URL` and `SECRET_KEY_BASE`
3. cert-manager installed in the cluster for TLS
4. NGINX ingress controller running
5. Network CIDR 10.0.0.0/8 correct for deployment environment

### Key Gaps in K8s

- No manifests for ANISA, PANX, or Cortex services — intelligence layer has zero K8s representation
- No manifests for event streaming (Kafka, NATS, RabbitMQ) — not designed for in the service graph
- No Redis Sentinel or Redis Cluster manifest — single-node Redis only, no HA
- Staging overlay is identical to base in practice — it is not a realistic proxy for production traffic, no replica reduction, no environment-specific configs
- No CD controller config (ArgoCD Application, FluxCD HelmRelease) — deployment mechanism is the shell script only, no GitOps
- No PersistentVolumeClaim definitions for any service — stateless assumption is unvalidated

---

## Terraform Layer

### What Exists

- `modules/vpc/main.tf`: complete AWS VPC — VPC resource, Internet Gateway, 3-zone public subnets (kubernetes.io/role/elb tagged), 3-zone private subnets (kubernetes.io/role/internal-elb tagged), 3-zone database subnets (isolated, no route to internet), NAT Gateway, Route Tables, VPC Flow Logs to CloudWatch (90-day retention), IAM role for flow logs
- `modules/database/main.tf`: complete AWS RDS PostgreSQL 16 — operational DB (Multi-AZ, gp3, encrypted, Performance Insights, 30-day backup, Secrets Manager credentials) + separate audit DB (90-day backup, `IMMUTABLE` tag, deletion protection always on), parameter group enforcing SSL/TLS 1.2, full query logging, pg_stat_statements, monitoring role with Enhanced Monitoring
- `environments/template/main.tf`: demonstrates wiring vpc + database modules with outputs
- `environments/template/terraform.tfvars.example`: variable reference

### Production-Deployable Assessment

Both modules are complete and correct. The VPC variable naming (`ghana-pilot`, `kenya-prod`) confirms Africa-first design intent. The database module's dual-instance design (operational + audit separate) matches the AUDITABLE principle implemented in Docker compose.

### What Is Missing in Terraform

These modules cover VPC and RDS only. The following are absent with no Terraform implementation:

| Component                             | Status                                           |
| ------------------------------------- | ------------------------------------------------ |
| EKS cluster (or GKE)                  | Not present                                      |
| ALB / NLB (load balancer)             | Not present                                      |
| ACM certificate management            | Not present                                      |
| CloudFront CDN                        | Not present                                      |
| ElastiCache (Redis HA)                | Not present                                      |
| WAF                                   | Not present                                      |
| AWS Secrets Manager standalone module | Not present                                      |
| ECR (container registry)              | Not present                                      |
| No instantiated environments          | Template only, no ghana-pilot or production dirs |

The Terraform can create a VPC and two RDS instances. It cannot create the Kubernetes cluster those instances are meant to serve, the load balancer that exposes it, or the registry where images are stored.

---

## Scripts

- `deploy.sh`: production-grade bash — environment validation (dev/staging/prod), approval-ticket enforcement for production, Docker image builds (api + crypto), Trivy security scanning (HIGH/CRITICAL exit on production), kustomize apply, rollout status wait, canary deployment for production (5% → 5-minute monitor → full), automatic rollback trigger, health check via `kubectl exec`, audit log append to `deployment.log`
- `migrate.sh`, `seed.sh`, `setup.sh`: referenced in README, exist as scripts

The deploy script is the most complete artifact in this repo. The canary monitoring logic is weak — it scans `kubectl top pods` output for the string "Error" rather than querying Prometheus error-rate metrics. This will miss many failure modes.

---

## Security

- `policies/access-control.md`: RBAC spec — roles (system_admin, platform_operator, field_inspector, producer, auditor), typed permission format (`resource:action:scope`), session timeout tables, API key rotation requirements, compliance checklists
- `policies/data-protection.md`: data classification and encryption requirements
- `policies/incident-response.md`: incident runbook with severity tiers
- `tools/scripts/security-status.js`: Node.js script for configuration status checking
- `security/reports/README.md`: placeholder directory for reports

These are policy documents, not enforcement artifacts. None of the RBAC role definitions are implemented as Kubernetes RBAC objects, OPA/Gatekeeper policies, or application middleware. They describe intent, not runtime behavior.

---

## What Would Break If Deployed Today

1. **No container images** — `deploy.sh` builds from a parent monorepo context that doesn't exist here; images must be pre-built elsewhere
2. **No K8s cluster Terraform** — the K8s manifests have no cluster to run on via infrastructure code
3. **No load balancer** — traffic cannot reach the K8s ingress from outside
4. **Missing secrets** — `deploy.sh` exits if `gtcx-secrets` not pre-created in namespace
5. **Missing DB init scripts** — postgres containers start without schema; referenced init-script directories do not exist
6. **Edge node not buildable** — `edge-runtime` Dockerfile target referenced in compose but not defined in any working Dockerfile
7. **Intelligence services absent** — no Docker, K8s, or Terraform for ANISA, PANX, Cortex
8. **Staging not differentiated** — deploying to staging gives identical config to base, not a useful pre-production gate

---

## Summary by Layer

| Layer                       | Completeness                | Production-Deployable          |
| --------------------------- | --------------------------- | ------------------------------ |
| Docker infra services       | Complete                    | Yes (locally)                  |
| Docker application services | Defined, not buildable here | No                             |
| K8s base manifests          | Complete                    | Yes (given prerequisites)      |
| K8s production overlay      | Complete                    | Yes (given prerequisites)      |
| K8s staging overlay         | Thin                        | Not a realistic gate           |
| Terraform VPC               | Complete                    | Yes (AWS)                      |
| Terraform database          | Complete                    | Yes (AWS)                      |
| Terraform EKS/cluster       | Absent                      | —                              |
| Terraform load balancer     | Absent                      | —                              |
| Terraform ECR/registry      | Absent                      | —                              |
| Deploy script               | Production-grade            | Yes (given K8s cluster exists) |
| Security policies           | Document-only               | Not enforced                   |
| Intelligence service infra  | Does not exist              | —                              |
