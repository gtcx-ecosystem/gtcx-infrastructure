# Contributing to GTCX Infrastructure

## Getting Started

```bash
git clone <repo-url>
cd gtcx-infrastructure
pnpm install
```

## Development Workflow

1. Create a feature branch from `main`
2. Make changes following the conventions below
3. Run checks: `pnpm lint && pnpm format:check`
4. Commit with conventional format
5. Open a PR against `main`

## Commit Style

Conventional commits, lowercase subject, imperative mood, no period:

```
type(scope): subject

body (optional)
```

Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `ci`

Scopes: `k8s`, `terraform`, `docker`, `security`, `deploy`, `observability`, `moat`

Examples:

```
feat(terraform): add backup module for audit snapshot export
fix(k8s): add seccompProfile to all pod security contexts
test(terraform): add native tests for database module
docs(ops): update deployment runbook with canary steps
```

## IaC Conventions

### Terraform

- One module per directory under `infra/terraform/modules/`
- Variables in `variables.tf`, outputs in `outputs.tf` (or inline in `main.tf` for small modules)
- Native tests in `*.tftest.hcl` using plan-mode validation
- Tag all resources with `Environment`, `ManagedBy`, `Project`

### Kubernetes

- Base manifests in `infra/kubernetes/base/`
- Environment-specific patches in `infra/kubernetes/overlays/`
- All pods: `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false`, `seccompProfile: RuntimeDefault`
- All deployments: resource requests/limits, liveness/readiness/startup probes, rolling update strategy

### Docker

- Multi-stage builds, non-root user (UID 1000-1001)
- `HEALTHCHECK` in every Dockerfile
- Pin base image versions

## Code Review Expectations

- All Terraform changes must include `terraform plan` output
- K8s manifest changes must pass `kubectl kustomize` build
- Security-sensitive changes require explicit reviewer approval
- Never commit secrets, tokens, or credentials

## Safety Rules

- Never apply infrastructure changes without explicit confirmation
- Never push to `main` without PR review
- Never use `--no-verify` or skip hooks
- Two separate databases: `gtcx_development` (operational) and `gtcx_audit` (append-only) — never merge, never cross-write
- See `docs/agents/workflows/agent-safety-rules.md` for the full authority matrix
