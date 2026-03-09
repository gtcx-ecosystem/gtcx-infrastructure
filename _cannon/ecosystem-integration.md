# Ecosystem Integration — gtcx-infrastructure

**Date:** 2026-03-09
**Scope:** 4-infrastructure — what this repo provides to the ecosystem, what it should provide, and the architectural gaps to close

---

## What This Repo Actually Provides Today

### Confirmed Integrations (Consuming Repos Can Use These)

**Local development stack.** Any GTCX repo can use `docker-compose.infra.yml` to spin up the full backing service layer — PostgreSQL (primary + audit), Redis, Prometheus, Grafana (datasource auto-provisioned), Jaeger, Loki. This is the primary concrete value of this repo today. Any engineer onboarding to any platform repo gets a working data and observability stack from a single command.

**K8s deployment target definitions.** The service manifests define the canonical runtime spec for api, crypto, tradepass, geotag, and gci. Replica counts, resource limits, HPA thresholds, network policy rules — these are authoritative for the services they cover. When 6-platforms ships deployable services, these manifests are the reference pattern.

**Network security graph.** The production `network-policies.yaml` is the only authoritative service-to-service communication map in the ecosystem. It specifies: api → crypto (8080), api → protocol services (3000), protocol services → crypto (8080), all services → database (5432). Everything else is default-denied. This document is infrastructure and policy simultaneously.

**Terraform database module.** Provides the reference RDS instantiation pattern for any environment — dual-instance operational + audit, encryption at rest, 90-day audit retention, Secrets Manager credentials. Any environment that stores GTCX data should reference this module.

**Deployment protocol.** `deploy.sh` defines the canonical deployment sequence: build → Trivy scan → canary (production only) → apply → verify → audit-log. Any CI automation should mirror this flow.

---

## What This Repo Is Intended to Provide That It Doesn't

### EKS Cluster Provisioning

K8s manifests assume a running cluster but no Terraform creates one. Every environment (Ghana pilot, Kenya staging, production) needs a cluster. The VPC and database modules exist — the EKS cluster with node groups in private subnets connected to RDS in database subnets is absent.

**Decision needed:** EKS managed node groups vs. Fargate. For Africa with variable load and spot pricing, managed node groups with mixed on-demand/spot is the right default. Fargate is simpler but ~30% more expensive and cannot use daemonsets for observability agents.

### Load Balancer / Ingress Provisioning

The K8s ingress assumes an NGINX ingress controller behind an ALB, and cert-manager provides TLS. Neither the ALB nor the ACM certificate has Terraform definitions. The path from `api.gtcx.io` DNS to a running pod does not exist in infrastructure code.

### Container Registry

Images are tagged `gtcx/api` and `gtcx/crypto` but no ECR repository is defined. No cross-account pull permissions, no image lifecycle policies. The deploy script builds and references images but has no place to push them.

### Intelligence Service Infrastructure

ANISA (Python), PANX consensus (Python), Cortex (TypeScript) have no K8s manifests, no Dockerfiles, and no Terraform resources in this repo. The intelligence layer is architecturally invisible to infrastructure.

### Event Streaming

All inter-service communication is currently HTTP. For PANX consensus flows, Cortex event ingestion, GCI compliance event propagation — all of which are event-driven by nature — the infrastructure must provide a message broker. No Kafka, NATS, or SQS is provisioned or even designed in this repo.

### Secret Management

The database module uses AWS Secrets Manager for RDS credentials, but application secrets (API keys, JWT signing keys, service credentials) have no provisioned infrastructure path. The deploy script checks for a pre-created K8s secret but provides no tooling to create it from a secure source.

---

## Integration Gaps: Who Should Be Consuming This Repo But Isn't

### 6-platforms (Backend Services)

The primary intended consumer. AGX, CRX, SGX, Veritas, Pathways — none have K8s manifests here. When platform services are built, each needs: Deployment + Service + HPA + PDB manifests (following api.yaml pattern), network policy rules (platform → protocol services), database connection via RDS module outputs, and per-environment overlays.

**Current state:** Absent entirely. The infrastructure team has no platform service definitions to work from because the platform services don't exist yet.

### 5-intelligence (ANISA, PANX, Cortex)

Intelligence services are Python (ANISA, PANX) and TypeScript (Cortex SDK). They need dedicated K8s manifests, potentially compute-optimized node selectors, a separate namespace or network segment (intelligence services should not be in the same flat network as protocol services), and separate database schemas. Python services need their own Dockerfiles — the existing `ruby-production` and `rust-production` targets are irrelevant.

**Current state:** Completely absent.

### CI/CD Systems

The deploy script is production-grade but no CI pipeline calls it. No GitHub Actions workflow in this repo triggers the deploy. Every deployment is manual today, which violates the AUDITABLE and DEPLOYABLE principles the scripts themselves reference.

### 3-protocols (VaultMark, PvP, PANX-as-protocol)

K8s manifests exist for TradePass, GeoTag, and GCI. VaultMark, PvP, and PANX (as a protocol service) have no K8s definitions even though they are production-ready in the protocols repo.

---

## Architectural Decisions Needed to Make This a First-Class Ecosystem Citizen

### 1. Complete the Terraform stack — unblocks everything else

Priority sequence: EKS cluster module → ECR module → ALB + ACM module → ElastiCache module → optional WAF. Without EKS, nothing runs in a repeatable, reproducible way.

### 2. Add event streaming infrastructure

Recommended: NATS JetStream (simpler than Kafka, suitable for variable Africa connectivity, supports at-least-once delivery, pub/sub and request/reply in one system). Add a Terraform module and K8s StatefulSet. This is prerequisite for Cortex event ingestion and PANX async consensus.

### 3. Separate the intelligence service plane

Define a `gtcx-intelligence` K8s namespace with its own network policies. Intelligence services should be callable by platform services via defined egress rules but should not share a flat network segment with protocol services. Add Dockerfiles for Python intelligence services.

### 4. Implement GitOps

The existing kustomize structure is already ArgoCD-compatible. Add `Application` manifests that point to this repo per environment. Remove the requirement for a human to SSH and run `deploy.sh`. The audit trail moves from a local file to Git history.

### 5. Instantiate environments

Create `environments/ghana-pilot/`, `environments/staging/`, `environments/production/` in Terraform. The template shows the pattern — the environments need to exist as code. The Ghana pilot specifically should be instantiated first.

---

## The Network Policy as Integration Map

The production `network-policies.yaml` is the single most important integration document in this repo. The current model:

```
internet → ingress → api → crypto
                         → tradepass
                         → geotag
                         → gci
                         → [database]
protocol services → crypto
                  → [database]
```

Missing from this map: intelligence services, event bus, platform services (crx, sgx, agx), mobile sync endpoints. Every new service must be added to network policies before it can communicate — the network policy is the enforcement mechanism and the architecture diagram simultaneously.
