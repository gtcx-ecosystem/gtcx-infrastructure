# GTCX Infrastructure

DevOps tooling, deployment automation, and security framework for the GTCX ecosystem. Manages container orchestration, infrastructure-as-code, compliance tooling, and zero-trust security across all environments. Used by platform engineers and DevOps teams deploying and operating GTCX services.

## Quick Navigation

| Document                                                         | Description                                    |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| [Documentation Index](./docs/README.md)                          | Full documentation hub                         |
| [Orientation](./docs/agents/onboarding/orientation.md)           | Start here — codebase map and session protocol |
| [Safety Rules](./docs/agents/workflows/agent-safety-rules.md)    | What requires human approval                   |
| [Architecture Overview](./docs/architecture/system-overview.md)  | System design, deployment model, trust zones   |
| [Trust Model](./docs/architecture/trust-model.md)                | Zero-trust security boundaries                 |
| [Quality Runbook](./docs/operations/runbooks/quality-runbook.md) | CI triage order and gate sequence              |
| [Release Checklist](./docs/devops/release/release-checklist.md)  | Release gate and evidence requirements         |
| [Roadmap](./docs/agile/sprint-roadmap.md)                        | Delivery roadmap and sprint status             |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20.0.0
- [pnpm](https://pnpm.io/) >= 9.15.0

### Setup

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Directory Structure

```
gtcx-infrastructure/
├── infra/
│   ├── docker/            # Dockerfiles + Compose (dev, infra, test)
│   ├── kubernetes/        # K8s manifests (base + dev/staging/production overlays)
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── vpc/       # VPC with public/private/database subnets, NAT, flow logs
│   │   │   ├── database/  # Dual RDS (operational + audit), Secrets Manager, TLS
│   │   │   ├── eks/       # Managed K8s cluster, IRSA, KMS, ALB controller IAM
│   │   │   └── ecr/       # Container registry (8 service repos, scan-on-push)
│   │   └── environments/
│   │       ├── template/          # Copy-and-customize pattern
│   │       └── zimbabwe-pilot/    # ZWCMP deployment (af-south-1)
│   ├── migrations/        # MABA/KORA/AMANI data transformation stack
│   ├── scripts/           # deploy.sh (canary, approval-gated), migrate, seed
│   └── security/          # Access control, data protection, incident response policies
├── tools/                 # Scripts and project templates
├── docs/                  # All documentation — architecture, ops, security, specs
└── turbo.json
```

## Dependencies

None. Standalone DevOps tooling consumed by all other repos.

## Principles

Primary principles for this repo:

- P12 Resilient — fault-tolerant, self-healing systems
- P14 Deployable — automated, reproducible, reversible deployments
- P15 Observable — structured metrics, logs, and traces
- P22 Portable — runs on any infrastructure
- P24 Scalable — handles growth without redesign

Required across all repos:

- P7 Open — open-source, no vendor lock-in
- P13 Modular — single responsibility, clear boundaries
- P27 Documented — every system and API is documented
- P29 Tested — automated tests for every module
- P30 Intentional — every line of code serves a purpose

## Cross-Links

- gtcx-docs — Ecosystem documentation hub
- gtcx-protocols — Protocol specs and delivery planning
- gtcx-core — Shared crypto, types, and schemas
