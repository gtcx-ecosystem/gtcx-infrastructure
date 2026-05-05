# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Terraform native tests for 12/14 modules (.tftest.hcl)
- Intelligence namespace Prometheus scrape config and 8 alerting rules
- compliance-db module: reusable dual-database for African fintech (7 jurisdictions)
- Detective controls module: CloudTrail + GuardDuty + SNS
- Compliance module: AWS Config recorder + 7 managed rules
- WAFv2 in ALB module: OWASP Core Rule Set + SQLi + IP rate limiting
- VPC endpoints: S3, ECR API/DKR, CloudWatch Logs, STS
- cert-manager with NATS TLS (self-signed ClusterIssuer, auto-rotation)
- metrics-server for HPA autoscaling
- EBS CSI driver with IRSA
- build-push.sh: container image build and ECR push script
- K8s hardening: rolling update strategy, startup probes, seccompProfile, security contexts on all deployments
- SLO recording rules with per-service latency compliance ratios
- Alertmanager escalation (critical repeat_interval: 15m)
- NATS account-based authentication (5 accounts with scoped publish/subscribe)
- Foreign key constraints on protocol tables
- SQL injection fix in migrate.sh (parameterized queries)
- CI docs-links job checking for stale references
- CONTRIBUTING.md
- Testnet-pilot environment deployed to af-south-1

### Changed

- EKS cluster version 1.29 → 1.30
- Loki retention 90 days → 365 days
- Lambda backup timeout 60s → 300s
- Dockerfile.protocols: frozen-lockfile → no-frozen-lockfile (crypto-native workspace exclusion)
- Dockerfile.platforms: CMD JSON form → shell form (env var expansion)
- DynamoDB lock tables now per-environment
- NATS config: removed cluster block for single-node, added TLS block
- StorageClass gp3 → gp2 (EBS CSI compatibility)

### Removed

- edge-proxy placeholder module (empty, no implementation)
- Stale \_sop/ path references (27+ files updated to docs/)

## [0.1.0] - 2026-03-20

### Added

- Terraform modules: VPC, Database, EKS, ECR, Secrets, Event-Bus
- K8s base manifests: API, Crypto, Protocols, Intelligence, NATS, Monitoring
- K8s overlays: development, staging, production, testnet
- Docker Compose: dev (20 services), infra (9 services), test (10 services)
- Database init scripts: 31 operational tables, 1 audit table
- Zimbabwe pilot environment (af-south-1)
- Monitoring: Prometheus, Grafana, Loki, Jaeger
- Security: network policies, pod security standards
- Deployment runbook, secrets management docs
- 11 Architecture Decision Records
