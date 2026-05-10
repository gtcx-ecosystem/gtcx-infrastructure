# GTCX Infrastructure

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

> **Enterprise-scale deployment infrastructure aligned with 30 Engineering Principles**

## Overview

This directory contains all infrastructure-as-code for deploying GTCX across any environment — from government data centers to edge devices at mining sites.

**Guiding Principle:** Same artifact runs everywhere. Configuration differs, code doesn't.

## Directory Structure

```
infra/
├── docker/                    # Container configurations
│   ├── Dockerfile.base        # Base image for all services
│   ├── Dockerfile.api         # Rails API services
│   ├── Dockerfile.rust        # Rust crypto services
│   ├── docker-compose.dev.yml # Local development
│   └── docker-compose.test.yml# CI/CD testing
│
├── kubernetes/                # K8s orchestration
│   ├── base/                  # Kustomize base resources
│   │   ├── namespace.yaml
│   │   ├── configmaps/
│   │   ├── secrets/
│   │   └── services/
│   ├── overlays/              # Environment-specific
│   │   ├── development/
│   │   ├── staging/
│   │   └── production/
│   └── kustomization.yaml
│
├── terraform/                 # Cloud provisioning (multi-cloud)
│   ├── modules/               # Reusable components
│   │   ├── vpc/
│   │   ├── kubernetes/
│   │   ├── database/
│   │   └── cache/
│   └── environments/          # Country-specific deployments
│       ├── ghana-pilot/
│       ├── ghana-prod/
│       └── template/
│
├── ansible/                   # On-premise provisioning
│   ├── playbooks/
│   └── roles/
│
├── scripts/                   # Deployment automation
│   ├── setup.sh               # Initial environment setup
│   ├── migrate.sh             # Database migrations
│   ├── seed.sh                # Seed data for development
│   └── deploy.sh              # Production deployment
│
└── edge-proxy/                # Edge/ingress configuration
    └── README.md
```

## Principle Alignment

| Component  | Principles Implemented                         |
| ---------- | ---------------------------------------------- |
| Docker     | DEPLOYABLE (14), PORTABLE (22), SECURE (11)    |
| Kubernetes | SCALABLE (24), RESILIENT (12), OBSERVABLE (15) |
| Terraform  | SOVEREIGN (6), OPEN (7), DEPLOYABLE (14)       |
| Scripts    | DOCUMENTED (27), TESTED (29), INTENTIONAL (30) |

## Deployment Tiers

| Tier | Target                 | Orchestrator   | Use Case                     |
| ---- | ---------------------- | -------------- | ---------------------------- |
| 1    | Government Data Center | K8s or K3s     | Primary sovereign deployment |
| 2    | In-Country Cloud       | Kubernetes     | Where govt DC unavailable    |
| 3    | Regional Hub           | K3s            | Multi-country federation     |
| 4    | Edge/Pilot             | Docker Compose | Remote sites, pilots         |

## Quick Start

### Local Development

```bash
# Start all services locally
./scripts/setup.sh
docker compose -f docker/docker-compose.dev.yml up

# Run migrations
./scripts/migrate.sh development

# Seed development data
./scripts/seed.sh
```

### Staging Deployment

```bash
# Deploy to Kubernetes staging
kubectl apply -k kubernetes/overlays/staging/
./scripts/deploy.sh staging
```

### Production Deployment

```bash
# Requires government sign-off
./scripts/deploy.sh production --approval-ticket=GTCX-XXX
```

## Security Requirements

- [Done] All artifacts signed (Cosign/Sigstore)
- [Done] No secrets in code or images
- [Done] Security scanning in CI/CD
- [Done] Encryption at rest (AES-256)
- [Done] TLS 1.3 for all communications

_Infrastructure that governments trust with their economic sovereignty._
