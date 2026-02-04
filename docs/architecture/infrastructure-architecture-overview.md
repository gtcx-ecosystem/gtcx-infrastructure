# GTCX Infrastructure -- Architecture Overview

| Field | Value |
|-------|-------|
| Layer | Supporting |
| Depends on | Nothing (standalone DevOps tooling) |
| Consumed by | All repos (deployment, security, templates) |
| Related | [Ecosystem Architecture](../../../docs/architecture/ecosystem-architecture-overview.md), [Dependency Map](../../../docs/architecture/dependency-map.md) |

## Role in the Ecosystem

DevOps tooling, deployment automation, and security framework for the entire GTCX ecosystem. Standalone repository with no runtime dependencies on other GTCX repos. Provides container orchestration, infrastructure-as-code, zero-trust security, and project scaffolding consumed by every other repository during deployment and operations. Designed around the guiding principle that the same artifact runs everywhere -- configuration differs, code does not.

## Infrastructure Components

### Container and Orchestration (infra/)

| Component | Purpose |
|-----------|---------|
| docker/ | Base images (Dockerfile.base), API containers (Dockerfile.api), Rust builder (Dockerfile.rust), compose files for dev and test |
| kubernetes/ | K8s manifests with Kustomize base and overlays (development, staging, production) |
| terraform/ | Multi-cloud provisioning with reusable modules (VPC, K8s, database, cache) and per-country environment configs |
| ansible/ | On-premise provisioning playbooks and roles for government data center deployments |

### Edge and Connectivity

| Component | Purpose |
|-----------|---------|
| edge-proxy/ | Edge/ingress proxy for field connectivity and low-bandwidth environments |
| migrations/ | Database migration scripts and tooling for schema evolution |

### Automation and Templates (tools/)

| Component | Purpose |
|-----------|---------|
| scripts/ | Setup, migration, seeding, and deployment automation (setup.sh, migrate.sh, seed.sh, deploy.sh) |
| templates/ | README templates, project scaffolding, engineering standards, and PRINCIPLES.md |

### Security Framework

| Component | Purpose |
|-----------|---------|
| security/ | Security policies, access control, data protection, incident response, and reports |

## Package Structure

| Package | Purpose |
|---------|---------|
| infra/edge-proxy | Edge proxy configuration and deployment for field environments |
| infra/migrations | Database migration tooling and schema versioning |
| tools/scripts | Deployment and setup automation consumed by CI/CD pipelines |
| tools/templates | Project templates, documentation standards, and engineering principles |

## Deployment Pipeline

```
Source Code (any GTCX repo)
        |
        v
CI/CD Pipeline (GitHub Actions)
        |
   ┌────┴────┐
   v         v
Docker    Terraform
Build     Provision
   |         |
   v         v
Registry  Cloud/On-Prem
   |         |
   └────┬────┘
        v
Kubernetes (Kustomize overlays)
   ┌────┼────┬────┐
   v    v    v    v
  Dev  Stg  Prod Edge
```

## Deployment Environments

- **Development** -- docker-compose local stack for rapid iteration
- **Staging** -- Kubernetes with automated CI/CD and integration testing
- **Production** -- Per-country deployment with jurisdiction-specific configuration (Ghana pilot, Ghana production)
- **Edge** -- Solar-powered field infrastructure with satellite connectivity and offline resilience

## Edge Architecture

Field sites operate on solar power with satellite connectivity (Starlink/VSAT). Progressive connectivity levels determine operational capability:

| Level | Connectivity | Capability |
|-------|-------------|------------|
| L0 | Offline | Local verification, queued sync |
| L1 | Intermittent (satellite burst) | Batch sync, priority uploads |
| L2 | Low-bandwidth (VSAT) | Near-real-time sync, compressed payloads |
| L3 | Full (fiber/4G) | Real-time streaming, full analytics |

Mesh networking between nearby field sites enables peer-to-peer data sharing even at L0. See [Edge Proxy Overview](../edge-proxy-overview.md) for the full edge architecture.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Kustomize over Helm | Simpler declarative overlays; no templating language to maintain; native kubectl integration |
| Ansible for government deployments | On-premise mandates in sovereign data center environments; agentless SSH-based provisioning |
| Edge proxy layer | Low-bandwidth field environments with satellite connectivity require local caching and request coalescing |
| Per-country Terraform configs | Data sovereignty requirements mandate isolated infrastructure per jurisdiction |

## Deep Dives

- [Infrastructure Overview](../infrastructure-overview.md) -- High-level architecture of the deployment stack
- [Digital Infrastructure Framework](../digital-infrastructure-framework.md) -- End-to-end digital infrastructure design
- [Six-Month Deployment Roadmap](../six-month-deployment-roadmap.md) -- Phased deployment plan across environments
- [Security Policies](../security/policies-overview.md) -- Security policy framework and standards
- [Access Control](../security/access-control.md) -- Access control policies and role definitions
- [Data Protection](../security/data-protection.md) -- Data protection and encryption standards
- [Incident Response](../security/incident-response.md) -- Security incident response procedures
- [Edge Proxy Overview](../edge-proxy-overview.md) -- Edge proxy architecture for field connectivity
- [Compliance OS Overview](../compliance-os-overview.md) -- Compliance operating system and automation
- [Migrations Overview](../migrations-overview.md) -- Data and service migration strategies
- [Infrastructure Economics](../infrastructure-economics.md) -- Cost modeling and optimization
- [Compliance Templates](../compliance-templates-overview.md) -- Compliance template engine overview
- [Storage as Infrastructure](../storage-as-infrastructure.md) -- Storage architecture and data persistence
- [Resilience Framework](../specs/resilience-framework.md) -- SPOF analysis, recovery targets, degradation tiers, and chaos testing
- [Testing Framework](../specs/testing-framework.md) -- Test strategy, coverage targets, and CI test gates
- [Observability Framework](../specs/observability-framework.md) -- Metrics, logging, tracing, and alerting
- [CI/CD Pipeline](../specs/cicd-pipeline.md) -- Pipeline stages, quality gates, and deployment strategy
- [Scalability Framework](../specs/scalability-framework.md) -- Capacity planning, horizontal scaling, and load testing
- [Data Governance](../specs/data-governance.md) -- Data classification, sovereignty, and retention policies
