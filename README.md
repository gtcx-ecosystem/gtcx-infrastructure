# GTCX Infrastructure

DevOps tooling, deployment automation, and security framework for the GTCX ecosystem. Manages container orchestration, infrastructure-as-code, compliance tooling, and zero-trust security across all environments. Used by platform engineers and DevOps teams deploying and operating GTCX services.

## Quick Navigation

| Document | Description |
|----------|-------------|
| [Architecture Overview](./docs/architecture/infrastructure-architecture-overview.md) | Composable architecture and ecosystem integration |
| [Infrastructure Overview](./docs/infrastructure-overview.md) | High-level architecture of the deployment stack |
| [Digital Infrastructure Framework](./docs/digital-infrastructure-framework.md) | End-to-end digital infrastructure design |
| [Six-Month Deployment Roadmap](./docs/six-month-deployment-roadmap.md) | Phased deployment plan across environments |
| [Security Policies](./docs/security/policies-overview.md) | Security policy framework and standards |
| [Edge Proxy Overview](./docs/edge-proxy-overview.md) | Edge proxy architecture for field connectivity |
| [Compliance OS Overview](./docs/compliance-os-overview.md) | Compliance operating system and automation |
| [Migrations Overview](./docs/migrations-overview.md) | Data and service migration strategies |
| [Infrastructure Economics](./docs/infrastructure-economics.md) | Cost modeling and optimization |

## Directory Structure

```
gtcx-infrastructure/
├── infra/                 # Core IaC (docker, kubernetes, terraform, edge-proxy, migrations, security, scripts)
├── tools/                 # Scripts and project templates
├── docs/                  # Infrastructure documentation and security policies
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── turbo.json
```

## Dependencies

None. Standalone DevOps tooling consumed by all other repos.

## Principles

> Full definitions: [PRINCIPLES.md](https://github.com/gtcx-protocol/gtcx-infrastructure/blob/main/tools/templates/PRINCIPLES.md)

Primary principles for this repo:

- P12 Resilient -- fault-tolerant, self-healing systems
- P14 Deployable -- automated, reproducible, reversible deployments
- P15 Observable -- structured metrics, logs, and traces
- P22 Portable -- runs on any infrastructure
- P24 Scalable -- handles growth without redesign

Required across all repos:

- P7 Open -- open-source, no vendor lock-in
- P13 Modular -- single responsibility, clear boundaries
- P27 Documented -- every system and API is documented
- P29 Tested -- automated tests for every module
- P30 Intentional -- every line of code serves a purpose
