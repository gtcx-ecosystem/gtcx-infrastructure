---
title: 'GTCX CI/CD Pipeline Specification'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'testing']
review_cycle: 'monthly'
---

# GTCX CI/CD Pipeline Specification

| Field   | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Scope   | All repositories in the GTCX ecosystem                                                         |
| Status  | Specification                                                                                  |
| Related | [Testing Framework](./testing-framework.md), [Resilience Framework](./resilience-framework.md) |

## Design Principles

1. **Any commit on main can be deployed to production with a single command** -- The main branch is always releasable. If it is not, that is a SEV-2 incident.
2. **The same artifact runs everywhere** -- Configuration differs between environments; code does not. A container image built from `main` is identical in staging and production.
3. **Security scanning is mandatory, not optional** -- Every build is scanned for vulnerabilities, secrets, and license violations. No bypasses, no skip flags.
4. **Rollback is always possible and automated** -- Every deployment is reversible. Canary failures trigger automatic rollback without human intervention.

## Pipeline Architecture

```
Developer ──→ PR ──→ [Lint + Type + Test + Security] ──→ Merge ──→ [Build + Publish] ──→ [Deploy]
                              │                                          │                    │
                        Quality Gate                              Artifact Registry      Canary → Full
                      (block on fail)                           (GHCR + npm)         (auto-rollback)
                              │                                          │                    │
                     ┌────────┴────────┐                    ┌───────────┴──────┐    ┌────────┴────────┐
                     │ ESLint/Biome    │                    │ Docker build     │    │ 5% → 25% → 100% │
                     │ tsc --noEmit    │                    │ turbo build      │    │ Health checks    │
                     │ vitest/pytest   │                    │ npm publish      │    │ Metric gates     │
                     │ Trivy/TruffleHog│                    │ SBOM generation  │    │ Auto-rollback    │
                     └─────────────────┘                    └──────────────────┘    └─────────────────┘
```

## Pipeline Stages

| Stage               | Tool                                             | Trigger                               | Timeout     | Failure Action                        |
| ------------------- | ------------------------------------------------ | ------------------------------------- | ----------- | ------------------------------------- |
| Lint                | ESLint + Biome (TS), Ruff (Python)               | PR opened / updated                   | 5 min       | Block merge                           |
| Type-check          | `tsc --noEmit` (TS), `mypy` (Python)             | PR opened / updated                   | 5 min       | Block merge                           |
| Test                | Vitest (TS), pytest (Python), cargo test (Rust)  | PR opened / updated                   | 10 min      | Block merge                           |
| Coverage            | @vitest/coverage-v8, pytest-cov, cargo-tarpaulin | PR opened / updated                   | (with test) | Block merge if below threshold        |
| Security scan       | Trivy (containers), TruffleHog (secrets)         | PR opened / updated + merge to main   | 10 min      | Block on critical/high                |
| Dependency audit    | npm audit, pip-audit                             | PR opened / updated + daily scheduled | 5 min       | Block on critical; ticket on high     |
| Build               | turbo build, Docker build                        | Merge to main                         | 15 min      | Alert team; block deployment          |
| SBOM                | Trivy SBOM generation                            | Merge to main (with build)            | 5 min       | Alert; non-blocking                   |
| Publish             | GHCR push, npm publish                           | Merge to main (with build)            | 10 min      | Alert team                            |
| Deploy (staging)    | Kustomize apply                                  | Automatic on successful build         | 30 min      | Alert team; auto-rollback             |
| Deploy (production) | Kustomize apply                                  | Manual trigger after staging green    | 30 min      | Auto-rollback on health check failure |

## GitHub Actions Workflow Templates

Three reusable workflow templates cover the entire ecosystem. Individual repositories reference these templates with minimal per-repo configuration.

### 1. TypeScript Monorepo

**Used by**: gtcx-core, gtcx-app, gtcx-protocols, gtcx-platforms, gtcx-design

| Step       | Command                                     | Caching               |
| ---------- | ------------------------------------------- | --------------------- |
| Install    | `pnpm install --frozen-lockfile`            | pnpm store cache      |
| Lint       | `turbo run lint`                            | Turborepo local cache |
| Type-check | `turbo run type-check`                      | Turborepo local cache |
| Test       | `turbo run test -- --coverage`              | Turborepo local cache |
| Build      | `turbo run build`                           | Turborepo local cache |
| Docker     | `docker build -t ghcr.io/gtcx/{repo}:{sha}` | Docker layer cache    |

**Turborepo**: Parallel execution respects package dependency graph. Changed packages and their dependents are tested; unchanged packages use cached results. Cache is local-per-runner.

### 2. Python Package

**Used by**: gtcx-protocols (Python SDK)

| Step       | Command                         | Caching            |
| ---------- | ------------------------------- | ------------------ |
| Install    | `uv sync`                       | uv cache           |
| Lint       | `ruff check .`                  | None (fast enough) |
| Type-check | `mypy .`                        | mypy cache         |
| Test       | `pytest --cov --cov-report=xml` | None               |
| Build      | `uv build`                      | None               |
| Publish    | `uv publish` (on tag)           | None               |

### 3. Documentation

**Used by**: gtcx-docs

| Step          | Command                                   | Purpose                      |
| ------------- | ----------------------------------------- | ---------------------------- |
| Markdown lint | `markdownlint-cli2 '**/*.md'`             | Consistent formatting        |
| Link check    | `lychee --offline '**/*.md'`              | No broken internal links     |
| Spell check   | `cspell '**/*.md'`                        | Catch typos in documentation |
| Build         | Framework-specific (Docusaurus/VitePress) | Verify docs build            |

## Quality Gates

| Gate                     | Metric                   | Threshold                                       | Enforcement                      |
| ------------------------ | ------------------------ | ----------------------------------------------- | -------------------------------- |
| Test pass rate           | All tests pass           | 100%                                            | Block merge                      |
| Coverage                 | Per-repo target          | See [Testing Framework](./testing-framework.md) | Block merge                      |
| TypeScript errors        | `tsc --noEmit` exit code | 0 errors                                        | Block merge                      |
| Python type errors       | `mypy` exit code         | 0 errors                                        | Block merge                      |
| Critical vulnerabilities | Trivy + npm audit        | 0 critical                                      | Block merge                      |
| High vulnerabilities     | Trivy + npm audit        | 0 high                                          | Block deploy to production       |
| Secret detection         | TruffleHog findings      | 0 findings                                      | Block merge; alert security team |
| Lint warnings            | ESLint/Biome/Ruff        | Must not increase vs. base branch               | Advisory (warning comment on PR) |
| License compliance       | License checker          | Only approved licenses (MIT, Apache-2.0, BSD)   | Block merge                      |

**Override policy**: Quality gates cannot be bypassed. There is no admin override for test failures or security findings. If a gate blocks incorrectly, the gate definition is fixed -- the gate is never skipped.

## Security Scanning

| Scanner            | What It Detects                               | When                       | Action on Finding                            |
| ------------------ | --------------------------------------------- | -------------------------- | -------------------------------------------- |
| Trivy (container)  | OS package CVEs, misconfiguration             | Every build                | Block on critical; ticket on high            |
| Trivy (filesystem) | Language-specific dependency CVEs             | Every PR                   | Block on critical; ticket on high            |
| Trivy (SBOM)       | Software bill of materials generation         | Every build                | Artifact stored with image                   |
| TruffleHog         | Secrets in code (API keys, tokens, passwords) | Every PR                   | Block merge; alert security team immediately |
| npm audit          | Node.js dependency vulnerabilities            | Every PR + daily scheduled | Block on critical; auto-PR for patches       |
| pip-audit          | Python dependency vulnerabilities             | Every PR + daily scheduled | Block on critical; auto-PR for patches       |
| Dependabot         | Outdated dependencies                         | Weekly scan                | Auto-PR for patch/minor; notify for major    |
| License checker    | Non-compliant dependency licenses             | Every PR                   | Block merge                                  |

## Deployment Strategy

| Environment | Strategy                       | Approval                            | Rollback                           | Data                            |
| ----------- | ------------------------------ | ----------------------------------- | ---------------------------------- | ------------------------------- |
| Development | Auto-deploy on merge to `main` | None                                | Immediate (`kubectl rollout undo`) | Synthetic test data             |
| Staging     | Auto-deploy on merge to `main` | None                                | Immediate                          | Anonymized production-like data |
| Production  | Canary (5% → 25% → 100%)       | Manual gate after staging green 24h | Auto on health check failure       | Production data                 |
| Edge        | Scheduled batch                | Field ops approval                  | Manual (remote device management)  | Jurisdiction-local data         |

### Canary Progression

```
  5% traffic ──(15 min)──→ Health check ──→ 25% traffic ──(30 min)──→ Health check ──→ 100%
       │                       │                  │                        │
       │                    PASS?                  │                     PASS?
       │                   /    \                  │                    /    \
       │                 YES     NO                │                 YES     NO
       │                  │      │                 │                  │      │
       │                  │      └──→ ROLLBACK ←───┘                  │      └──→ ROLLBACK
       │                  │                                           │
       │                  └──→ continue                               └──→ DEPLOYED
```

**Health check criteria during canary**: Error rate < baseline + 0.1%, p99 latency < baseline + 20%, no new error types in logs.

## Rollback Procedures

| Trigger                         | Type      | Mechanism                                                  | RTO            |
| ------------------------------- | --------- | ---------------------------------------------------------- | -------------- |
| Canary health check failure     | Automated | Kubernetes rollout undo to previous ReplicaSet             | < 1 min        |
| Post-deploy regression detected | Manual    | `kubectl rollout undo deployment/{service} -n {namespace}` | < 5 min        |
| Database migration failure      | Manual    | Forward-fix (migrations are forward-only)                  | Depends on fix |
| Configuration error             | Manual    | Revert ConfigMap/Secret and restart pods                   | < 5 min        |

**Database migration safety**: Migrations are always forward-only. Backward compatibility is maintained for 2 versions (current and previous). Destructive schema changes (column drops, type changes) are executed in 3 phases: (1) add new, (2) migrate data, (3) remove old (next release).

## Artifact Management

| Artifact Type             | Registry        | Naming Convention                       | Retention                                  |
| ------------------------- | --------------- | --------------------------------------- | ------------------------------------------ |
| Container images          | GHCR            | `ghcr.io/gtcx/{repo}:{git-sha-short}`   | 90 days; tagged releases (`v*`): permanent |
| Container images (tagged) | GHCR            | `ghcr.io/gtcx/{repo}:v{semver}`         | Permanent                                  |
| npm packages              | GitHub Packages | `@gtcx/{package}`                       | Permanent (semver)                         |
| Python packages           | PyPI (future)   | `gtcx-{package}`                        | Permanent (semver)                         |
| SBOM                      | GHCR (attached) | OCI artifact attached to image          | Same as parent image                       |
| Helm charts               | GHCR (OCI)      | `ghcr.io/gtcx/charts/{chart}:{version}` | Permanent                                  |

**Image tagging**: Every image is tagged with its Git SHA. Release images additionally receive a semver tag. The `latest` tag is never used -- it is ambiguous and unreproducible.

## Environment Promotion

```
Feature Branch ──→ PR ──→ main ──→ Staging (auto) ──→ Production (manual gate)
                                        │
                                  ┌─────┴──────┐
                                  │ Integration │
                                  │   tests     │
                                  │ Performance │
                                  │  baseline   │
                                  └─────────────┘
```

**Production deployment prerequisites**:

- Staging environment green for minimum 24 hours
- No open critical or high-severity issues against the release
- Integration test suite passing in staging
- Performance baseline comparison shows no regression > 10%
- Deployment approval from on-call engineer

## Per-Jurisdiction Deployment

| Aspect                   | Implementation                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Infrastructure isolation | Each jurisdiction (Ghana, Kenya) has isolated Terraform state and independent Kubernetes namespaces             |
| Data sovereignty         | Jurisdiction-specific secrets, database instances, HSM keys; no cross-jurisdiction data flow for sovereign data |
| Configuration            | Jurisdiction-specific values in `infra/terraform/environments/{jurisdiction}/`                                  |
| Edge sites               | Provisioned via Ansible playbooks; government data center specifications per jurisdiction                       |
| Compliance               | Jurisdiction-specific compliance checks in deployment pipeline (e.g., data residency verification)              |

**Adding a new jurisdiction**: Copy the Terraform environment template, configure jurisdiction-specific values for HSM, database, and networking, run `terraform plan` for review, and apply only after compliance team approval. No application code changes are required. See [Scalability Framework](./scalability-framework.md) for commodity and jurisdiction scaling.

## Deep Dives

- [Testing Framework](./testing-framework.md) -- Test types, coverage targets, and property-based testing requirements enforced by this pipeline
- [Resilience Framework](./resilience-framework.md) -- Recovery targets and degradation tiers that inform deployment safety
- [Infrastructure Architecture](../architecture/infrastructure-architecture-overview.md) -- Kubernetes cluster configuration, Terraform structure, and edge deployment topology
- [Security Policies](../security/security-policy.md) -- Security scanning requirements and vulnerability management policy
- [Observability Framework](./observability-framework.md) -- Metrics and alerting that drive canary health checks
- Terraform configurations: `gtcx-infrastructure/infra/terraform/`
