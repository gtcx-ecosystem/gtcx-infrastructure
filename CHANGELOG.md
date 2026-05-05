# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Terraform modules: VPC, Database, EKS, ECR, Secrets, Event-Bus (6 modules)
- K8s base manifests: API, Crypto, TradePass, GeoTag, GCI, Intelligence (ANISA + SDK), NATS
- K8s overlays: development, staging, production
- Production hardening: ALB controller, ALB ingress, network policies, pod security
- Docker Compose environments: dev (20 services), infra (9 services), test (10 services)
- Database init scripts: 31 operational tables, 1 audit table
- Zimbabwe pilot environment: af-south-1 (VPC + EKS + dual RDS + ECR)
- NATS JetStream event bus with Terraform module
- Intelligence K8s services (ANISA FastAPI + SDK HTTP)
- Monitoring: Prometheus alerts, Grafana dashboard (intelligence)
- Security: network policies, pod security standards, access control docs
- Edge proxy placeholder with architecture rationale
- Deployment runbook with prerequisites, setup, secrets, verification, rollback
- Secrets management documentation
- CHANGELOG.md (this file)

### Changed

- Consolidated legacy `infra/k8s/` into canonical `infra/kubernetes/` (Kustomize-based). Unique intelligence configs (canary, secrets, namespace) moved to `overlays/production/intelligence/`. Redundant anisa/sdk-server manifests removed (already covered by `base/services/intelligence.yaml`)
- Standardized `imagePullPolicy: IfNotPresent` across all base service manifests
- Terraform template backend block uncommented with CHANGE-ME placeholders (fails-safe)
- Base kustomization secrets annotated with "NEVER USE IN PRODUCTION" warning block
