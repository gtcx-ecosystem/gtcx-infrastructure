# GTCX Infrastructure

DevOps tooling, deployment automation, and security framework for the GTCX ecosystem. Manages container orchestration, infrastructure-as-code, compliance tooling, and zero-trust security across all environments.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20.0.0
- [pnpm](https://pnpm.io/) >= 9.15.0
- [Terraform](https://www.terraform.io/) >= 1.7 (for IaC)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) (for K8s operations)
- [Docker](https://www.docker.com/) (for local development)
- [AWS CLI](https://aws.amazon.com/cli/) v2 (for cloud deployments)

### Setup

```bash
git clone <repo-url>
cd gtcx-infrastructure
pnpm install
```

### Validate

```bash
pnpm lint              # Lint IaC and scripts
pnpm format:check      # Verify Prettier formatting
```

### Local Development Stack

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

This starts: PostgreSQL (operational + audit), NATS with JetStream, Prometheus, Grafana, Loki, Jaeger.

### Terraform (IaC)

```bash
cd infra/terraform/environments/testnet-pilot
terraform init
terraform plan
terraform apply   # requires explicit confirmation
```

### Kubernetes

```bash
kubectl kustomize infra/kubernetes/base/           # preview base manifests
kubectl kustomize infra/kubernetes/overlays/testnet # preview testnet overlay
```

## Architecture

```
gtcx-infrastructure/
├── infra/
│   ├── docker/              # Dockerfiles + Compose (dev, infra, test)
│   ├── kubernetes/
│   │   ├── base/            # K8s manifests (6 services + NATS + monitoring)
│   │   └── overlays/        # dev, staging, production, testnet
│   ├── terraform/
│   │   ├── modules/         # 14 reusable modules
│   │   │   ├── vpc/         # VPC with 3 subnet tiers, NAT, flow logs, VPC endpoints
│   │   │   ├── database/    # Dual RDS (operational + append-only audit)
│   │   │   ├── eks/         # EKS cluster, IRSA, KMS secrets encryption
│   │   │   ├── ecr/         # Container registry (KMS, scan-on-push, lifecycle)
│   │   │   ├── alb/         # ALB controller + ACM + WAFv2 (OWASP + SQLi + rate limit)
│   │   │   ├── backup/      # Audit snapshot export (Lambda + S3 + 7yr Glacier)
│   │   │   ├── detective/   # CloudTrail + GuardDuty + SNS alerts
│   │   │   ├── compliance/  # AWS Config (7 managed rules)
│   │   │   ├── compliance-db/ # Reusable dual-DB for African fintech (7 jurisdictions)
│   │   │   ├── event-bus/   # NATS JetStream infrastructure
│   │   │   ├── kyc-documents/ # S3 KYC storage (FATF 5yr, presigned URLs, IRSA)
│   │   │   ├── secrets/     # Secrets Manager + ESO + IRSA
│   │   │   ├── ci/          # CI/CD IAM roles
│   │   │   └── (12/14 modules have native Terraform tests)
│   │   └── environments/
│   │       ├── testnet-pilot/  # Live in af-south-1
│   │       └── zimbabwe-pilot/ # ZWCMP deployment
│   ├── monitoring/          # SLO recording rules, alert configs
│   ├── scripts/             # deploy.sh, migrate.sh, build-push.sh
│   └── security/            # Access control, data protection policies
├── docs/                    # Architecture, ops, security, specs (50+ docs)
│   ├── decisions/           # 11 ADRs
│   ├── operations/runbooks/ # 12 runbooks (deploy, rollback, DR, incident)
│   └── assessments/audit/   # Automated audit cycle reports
└── CLAUDE.md                # Agent conventions and commands
```

## Terraform Modules

| Module        | Purpose                                                            | Tests  |
| ------------- | ------------------------------------------------------------------ | ------ |
| vpc           | VPC, subnets, NAT, flow logs, VPC endpoints                        | 6 runs |
| database      | Dual PostgreSQL (operational + audit), encryption, Secrets Manager | 6 runs |
| eks           | EKS cluster, IRSA, KMS, control plane logging                      | 5 runs |
| ecr           | Container registry, KMS encryption, lifecycle, scan-on-push        | 6 runs |
| alb           | ALB controller, ACM, WAFv2 (OWASP + SQLi + rate limiting)          | 7 runs |
| backup        | Audit snapshot export to S3 with 7-year Glacier retention          | 7 runs |
| detective     | CloudTrail + GuardDuty + SNS security alerts                       | 8 runs |
| compliance    | AWS Config recorder + 7 managed compliance rules                   | 9 runs |
| compliance-db | Reusable dual-DB for African fintech (7 jurisdictions)             | 7 runs |
| event-bus     | NATS JetStream security group + EBS volumes                        | 7 runs |
| kyc-documents | S3 KYC storage with FATF retention and IRSA                        | 7 runs |
| secrets       | Secrets Manager + IRSA for intelligence services                   | 3 runs |
| ci            | CI/CD IAM roles                                                    | —      |

## Testnet Pilot (Live)

Running in AWS af-south-1 (Cape Town):

- **EKS:** 2x t3.small nodes, K8s 1.30
- **Services:** Protocols (6 protocols, 64 handlers), NATS (TLS + JetStream)
- **Data:** Dual RDS (encrypted), 11 ECR repos
- **Security:** WAF, ALB with TLS 1.3, cert-manager, NetworkPolicies
- **Observability:** Prometheus, Grafana, Loki, Jaeger, metrics-server

## Key Documents

| Document                                                               | Description                    |
| ---------------------------------------------------------------------- | ------------------------------ |
| [Orientation](./docs/agents/onboarding/orientation.md)                 | Start here — codebase map      |
| [Safety Rules](./docs/agents/workflows/agent-safety-rules.md)          | What requires human approval   |
| [Architecture Overview](./docs/architecture/system-overview.md)        | System design and trust zones  |
| [Deployment Runbook](./docs/operations/runbooks/deployment-runbook.md) | Deploy and rollback procedures |
| [DR Runbook](./docs/operations/runbooks/disaster-recovery.md)          | Backup and recovery            |
| [ADR Index](./docs/decisions/README.md)                                | Architecture decisions         |
| [Audit Reports](./docs/assessments/audit/)                             | Automated audit cycle history  |

## Standalone Modules

- [terraform-aws-compliance-db](https://github.com/amani-amina-anai/terraform-aws-compliance-db) — Compliance-ready dual-database for regulated African fintech. MIT licensed, 7 jurisdictions, published on GitHub.
