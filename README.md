# GTCX Infrastructure

[![CI](https://github.com/gtcx-ecosystem/gtcx-infrastructure/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/gtcx-ecosystem/gtcx-infrastructure/actions/workflows/ci.yml)
[![IaC validation](https://github.com/gtcx-ecosystem/gtcx-infrastructure/actions/workflows/ci.yml/badge.svg?branch=main&label=IaC)](https://github.com/gtcx-ecosystem/gtcx-infrastructure/actions/workflows/ci.yml)
[![Security](https://github.com/gtcx-ecosystem/gtcx-infrastructure/actions/workflows/ci.yml/badge.svg?branch=main&label=security)](https://github.com/gtcx-ecosystem/gtcx-infrastructure/actions/workflows/ci.yml)

Engineering scores (IR / XC): [`01-docs/05-audit/latest.json`](./01-docs/05-audit/latest.json).

DevOps tooling, deployment automation, and security framework for the GTCX ecosystem. Manages container orchestration, infrastructure-as-code, compliance tooling, and zero-trust security across all environments.

---

## 🚀 Choose Your Path

- **What's being worked on now** → [`01-docs/05-audit/execution-roadmap.md`](./01-docs/05-audit/execution-roadmap.md) (canonical execution plan) + [`01-docs/05-audit/latest.json`](./01-docs/05-audit/latest.json) (**IR** engineering + **XC** external scores) + [`01-docs/05-audit/SCORING.md`](./01-docs/05-audit/SCORING.md) (two independent tracks).
- **I am a DevOps/Platform Engineer** → Start with [Orientation](./01-docs/01-agents/onboarding/orientation.md) & [Deployment Runbook](./01-docs/04-ops/runbooks/deployment-runbook.md).
- **I am a Security Auditor** → Review the [Trust Model](./01-docs/architecture/trust-model.md), the [latest independent audit](./01-docs/05-audit/post-roadmap-session-2026-05-30.md), and the [external dependencies register](./01-docs/05-audit/external-dependencies-register-2026-05-31.md).
- **I am a Government/Institutional Stakeholder** → Read the [Sovereign Stack Whitepaper](./01-docs/05-audit/qa-reviews/2026-05-05-gtcx-sovereign-stack-whitepaper.md) and the [pilot success criteria](./01-docs/05-audit/pilot-success-criteria.md).

---

## ⚠️ Operational Constraints

> **Note:** Current operational logic (deployments, canary, secrets) is handled via **Bash scripts**. Ensure your shell environment is secure and avoid logging sensitive `stdout` until the transition to the compiled **GTCX-CTL** is complete. See the [Hardening Strategy](./01-docs/05-audit/qa-reviews/2026-05-05-gtcx-hardening-strategy.md).

This repo now ships a real validation entrypoint for that Bash surface at `pnpm test` and `pnpm test:full`. Those checks are required until the control plane transition is complete.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20.18.0
- [pnpm](https://pnpm.io/) >= 9.15.0
- [Terraform](https://www.terraform.io/) >= 1.7 (for IaC)
- [kubectl](https://kubernetes.io/01-docs/tasks/03-platform/tools/) (for K8s operations)
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
docker compose -f 04-ship/docker/docker-compose.dev.yml up -d
```

This starts: PostgreSQL (operational + audit), NATS with JetStream, Prometheus, Grafana, Loki, Jaeger.

### Terraform (IaC)

```bash
cd 04-ship/terraform/environments/testnet-pilot
terraform init
terraform plan
terraform apply   # requires explicit confirmation
```

### Kubernetes

```bash
kubectl kustomize 04-ship/kubernetes/base/           # preview base manifests
kubectl kustomize 04-ship/kubernetes/overlays/testnet # preview testnet overlay
```

## Architecture

```
gtcx-infrastructure/
├── 04-ship/
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
│   ├── 03-platform/scripts/             # deploy.sh (deprecated 2026-Q3, see IR-6.4), migrate.sh, build-push.sh
│   └── security/            # Access control, data protection policies
├── 01-docs/                    # Architecture, ops, security, compliance, GTM (250+ docs)
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

| Document                                                              | Description                    |
| --------------------------------------------------------------------- | ------------------------------ |
| [Orientation](./01-docs/01-agents/onboarding/orientation.md)          | Start here — codebase map      |
| [Safety Rules](./01-docs/01-agents/workflows/agent-safety-rules.md)   | What requires human approval   |
| [Architecture Overview](./01-docs/architecture/system-overview.md)    | System design and trust zones  |
| [Deployment Runbook](./01-docs/04-ops/runbooks/deployment-runbook.md) | Deploy and rollback procedures |
| [DR Runbook](./01-docs/04-ops/runbooks/disaster-recovery.md)          | Backup and recovery            |
| [ADR Index](./01-docs/architecture/decisions/README.md)               | Architecture decisions         |
| [Audit History](./01-docs/05-audit/qa-reviews/)                       | Session audits and hardening   |

## Published Substrate

GTCX's compliance substrate is published as three composable primitives. Each is independently useful; together they form the audit + storage + agent-discovery surface behind the testnet pilot. All MIT licensed.

| Primitive                          | Where                                                                                                                                                                | Purpose                                                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **`@gtcx/audit-signer`**           | [npm](https://www.npmjs.com/package/@gtcx/audit-signer) · [`03-platform/tools/audit-signer/`](./03-platform/tools/audit-signer/)                                     | Ed25519-signed, hash-linked audit chain. Zero runtime dependencies. Third-party verifiable offline.                                |
| **`terraform-aws-compliance-db`**  | [GitHub](https://github.com/amani-amina-anai/terraform-aws-compliance-db) · [`04-ship/terraform/modules/compliance-db/`](./04-ship/terraform/modules/compliance-db/) | Dual-database (operational + audit) module for regulated African fintech. 11 jurisdictions covered, FATF-aligned retention floors. |
| **`@gtcx/compliance-gateway-mcp`** | [`03-platform/tools/compliance-gateway-mcp/`](./03-platform/tools/compliance-gateway-mcp/)                                                                           | Model Context Protocol server exposing the gateway's read-only surface to AI agents. Mutating tools deliberately absent.           |

Detailed pages: [`01-docs/external/docs-site/`](./01-docs/gitbook/) (markdown source for `gtcx.trade/compliance`).

## Internal Workspace Packages

The repo is a pnpm workspace with 11 packages under `03-platform/tools/`. The ones above are publication targets; the ones below run the testnet pilot.

| Package                                                               | Role                                                                   |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`@gtcx/compliance-gateway`](./03-platform/tools/compliance-gateway/) | AI-native HTTP gateway routing compliance queries to protocol tools    |
| [`@gtcx/audit-flush`](./03-platform/tools/audit-flush/)               | Sidecar that ships signed audit records from NATS JetStream to WORM S3 |
| [`@gtcx/replay-protection`](./03-platform/tools/replay-protection/)   | Nonce + timestamp + signature verification for offline-queued requests |
| [`@gtcx/deployment-guard`](./03-platform/tools/deployment-guard/)     | Canary deployment safety gates                                         |
| [`@gtcx/ussd-handler`](./03-platform/tools/ussd-handler/)             | USSD menu + SMS bridge for feature-phone access                        |
| [`@gtcx/low-bandwidth`](./03-platform/tools/low-bandwidth/)           | Adaptive low-bandwidth middleware                                      |
| [`@gtcx/eval-pipeline`](./03-platform/tools/eval-pipeline/)           | AI output evaluation + prompt-injection red-team                       |
| [`@gtcx/compliance-data`](./03-platform/tools/compliance-data/)       | Per-jurisdiction regulator + retention catalog                         |

## Standalone Modules

- [terraform-aws-compliance-db](https://github.com/amani-amina-anai/terraform-aws-compliance-db) — Compliance-ready dual-database for regulated African fintech. MIT licensed, 11 jurisdictions, published on GitHub.

## Agent & workspace index

| Resource            | Path                                                  |
| ------------------- | ----------------------------------------------------- |
| **Any terminal**    | [`agents/README.md`](./agents/README.md)              |
| **Cursor**          | [`AGENTS.md`](./AGENTS.md)                            |
| **Operational SoR** | [`workspace/`](./workspace/) — `pnpm workspace:check` |
| **Docs map**        | [`01-docs/README.md`](./01-docs/README.md)            |

Protocol [P29 workspace domains](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/01-docs/governance/protocols/29-agent-workspace-domains/protocol.md).

<!-- gtcx-agents-index -->
