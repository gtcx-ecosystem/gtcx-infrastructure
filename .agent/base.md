## Repository

`fabric-os` — Service fabric execution layer for GTCX: AWS/K8s/Terraform control plane, deployment choreography, DaaS/SECaaS, and fleet infra assurance.

## Stack

- **Languages:** TypeScript, JavaScript (ESM), Bash, HCL (Terraform)
- **Frameworks:** Node.js 20+, Astro (docs-site), NATS JetStream, AWS SDK v3
- **Package manager:** pnpm (workspace monorepo, 13 packages)
- **Runtime:** Node.js 20+, Docker, Kubernetes (EKS on af-south-1)
- **Infrastructure:** AWS (af-south-1), Terraform, Helm, Linkerd service mesh, Kyverno policies

## Non-Negotiables

1. **Conventional commits** — `type(scope): subject`, lowercase, imperative.
2. **No emojis** unless explicitly requested.
3. **No going in circles** — read this file + the repo's own docs before exploring.

## Build & Run

```bash
# Install dependencies
pnpm install

# Run all validation gates (17 gates: coverage, static, security, build)
node platform/tools/platform/scripts/validate-all.mjs

# Run tests for a specific tool
node --test platform/tools/<tool>/tests/**/*.test.mjs

# Regenerate agent-sync docs
pnpm agent:sync

# Docker build (example: audit-flush)
docker build -t audit-flush:latest platform/tools/audit-flush/

# Terraform (staging)
cd deploy/terraform/environments/staging && terraform plan -var-file=terraform.tfvars
```
