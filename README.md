# GTCX Infrastructure

DevOps tooling, deployment automation, and security framework for the GTCX ecosystem. Manages container orchestration, infrastructure-as-code, compliance tooling, and zero-trust security across all environments. Used by platform engineers and DevOps teams deploying and operating GTCX services.

## Quick Navigation

| Document | Description |
|----------|-------------|
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
