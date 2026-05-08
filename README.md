# GTCX Infrastructure

![CI Status](https://img.shields.io/badge/CI-Passing-success)
![IaC Validation](https://img.shields.io/badge/IaC-Validated-blue)
![Security Scan](https://img.shields.io/badge/Trivy-No_Vulnerabilities-success)
![Doc Coverage](https://img.shields.io/badge/Doc_Coverage-98%25-blueviolet)

DevOps tooling, deployment automation, and security framework for the GTCX ecosystem. Manages container orchestration, infrastructure-as-code, compliance tooling, and zero-trust security across all environments.

---

## 🚀 Choose Your Path

- **I am a DevOps/Platform Engineer** → Start with [Orientation](./docs/agents/onboarding/orientation.md) & [Deployment Runbook](./docs/operations/runbooks/deployment-runbook.md).
- **I am a Security Auditor** → Review the [Trust Model](./docs/architecture/trust-model.md) & [Hardening Strategy](./docs/audit/qa-reviews/2026-05-05-gtcx-hardening-strategy.md).
- **I am a Government/Institutional Stakeholder** → Read the [Sovereign Stack Whitepaper](./docs/audit/qa-reviews/2026-05-05-gtcx-sovereign-stack-whitepaper.md).

---

## ⚠️ Operational Constraints

> **Note:** Current operational logic (deployments, canary, secrets) is handled via **Bash scripts**. Ensure your shell environment is secure and avoid logging sensitive `stdout` until the transition to the compiled **GTCX-CTL** is complete. See the [Hardening Strategy](./docs/audit/qa-reviews/2026-05-05-gtcx-hardening-strategy.md).

This repo now ships a real validation entrypoint for that Bash surface at `pnpm test` and `pnpm test:full`. Those checks are required until the control plane transition is complete.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20.0.0
- [pnpm](https://pnpm.io/) >= 9.15.0
- [Terraform](https://www.terraform.io/) >= 1.7 (for IaC)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) (for K8s operations)
- [Docker](https://www.docker.com/) (for local development)
- [AWS CLI](https://aws.amazon.com/cli/) v2 (for cloud deployments)
- [ShellCheck](https://www.shellcheck.net/) (for operator-script validation)

### Setup

```bash
git clone <repo-url>
cd gtcx-infrastructure
pnpm install
```

### Validate

```bash
pnpm lint              # Lint workspace packages
pnpm format:check      # Verify Prettier formatting
pnpm test              # Policy checks, shellcheck, and operator-script smoke tests
pnpm test:full         # Add terraform validate/test, kustomize, compose, and deploy dry-run validation
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
│   │   ├── base/            # K8s manifests (14 services + NATS + monitoring)
│   │   └── overlays/        # dev, staging, production, testnet
│   ├── terraform/
│   │   ├── modules/         # 20 reusable modules
│   │   │   ├── vpc/         # VPC with 3 subnet tiers, NAT, flow logs, VPC endpoints
│   │   │   ├── database/    # Dual RDS (operational + append-only audit)
│   │   │   ├── eks/         # EKS cluster, IRSA, KMS, GPU node pool
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
│   │   │   ├── vault/       # HashiCorp Vault (HA, KMS unseal, dynamic creds, PKI)
│   │   │   ├── ml-pipeline/ # S3 datasets, model registry (DynamoDB), IRSA
│   │   │   ├── trace-pipeline/ # Tempo (S3 backend), SQS event stream
│   │   │   └── (18/20 modules have native Terraform tests)
│   │   └── environments/
│   │       ├── testnet-pilot/  # Live in af-south-1
│   │       └── zimbabwe-pilot/ # ZWCMP deployment
│   ├── monitoring/          # SLO recording rules, alert configs
│   ├── scripts/             # deploy.sh, migrate.sh, build-push.sh
│   └── security/            # Access control, data protection policies
├── docs/                    # Architecture, ops, security, compliance, GTM (250+ docs)
│   ├── decisions/           # 11 ADRs
│   ├── operations/runbooks/ # 25 runbooks (deploy, rollback, DR, incident, release, chaos)
│   └── audit/qa-reviews/    # Session audits, roadmap, hardening strategy
└── CLAUDE.md                # Agent conventions and commands
```

## Terraform Modules

| Module                 | Purpose                                                                 | Tests   |
| ---------------------- | ----------------------------------------------------------------------- | ------- |
| vpc                    | VPC, subnets, NAT, flow logs, VPC endpoints                             | 5 runs  |
| database               | Dual PostgreSQL (operational + audit), encryption, Secrets Manager      | 6 runs  |
| eks                    | EKS cluster, IRSA, KMS, control plane logging                           | 4 runs  |
| ecr                    | Container registry, KMS encryption, lifecycle, scan-on-push             | 6 runs  |
| alb                    | ALB controller, ACM, WAFv2 (OWASP + SQLi + rate limiting)               | 6 runs  |
| backup                 | Audit snapshot export to S3 with 7-year Glacier retention               | 7 runs  |
| detective              | CloudTrail + GuardDuty + SNS security alerts                            | 8 runs  |
| compliance             | AWS Config recorder + managed compliance rules + encryption enforcement | 9 runs  |
| compliance-db          | Reusable dual-DB for African fintech (11 jurisdictions)                 | 7 runs  |
| event-bus              | NATS JetStream security group + EBS volumes                             | 7 runs  |
| kms-signing            | KMS asymmetric signing keys (ECC_NIST_P256) + CloudTrail audit          | 6 runs  |
| kyc-documents          | S3 KYC storage with FATF retention and IRSA                             | 7 runs  |
| secrets                | Secrets Manager + IRSA for intelligence services                        | 3 runs  |
| ci                     | CI/CD IAM roles                                                         | —       |
| vault                  | HashiCorp Vault HA (KMS unseal, dynamic DB creds, PKI, AWS engine)      | 15 runs |
| ml-pipeline            | S3 datasets + models, DynamoDB model registry, IRSA                     | 12 runs |
| trace-pipeline         | Tempo (S3 backend), SQS trace events + DLQ, IRSA                        | 11 runs |
| multi-region           | Route53 failover, RDS cross-region replica, S3 replication              | —       |
| workflow-orchestration | Step Functions + SQS + Lambda orchestration                             | 6 runs  |
| worm-audit             | S3 Object Lock (WORM) for immutable audit storage                       | 10 runs |

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
| [Audit History](./docs/audit/qa-reviews/)                              | Session audits and hardening   |

## Standalone Modules

- [terraform-aws-compliance-db](https://github.com/amani-amina-anai/terraform-aws-compliance-db) — Compliance-ready dual-database for regulated African fintech. MIT licensed, 7 jurisdictions, published on GitHub.
