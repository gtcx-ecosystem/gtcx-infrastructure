---
title: '04-ship/03-platform/scripts/ — Runtime Operations Scripts'
status: 'current'
date: '2026-05-24'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['scripts', 'operations', 'deploy', 'migrate', 'aws', 'kubernetes']
review_cycle: 'on-change'
---

# 04-ship/03-platform/scripts/ — Runtime Operations Scripts

**Charter:** Scripts invoked at runtime against AWS / Kubernetes / production environments. Operational lifecycle: provision → deploy → migrate → snapshot → rollback. All bash. All idempotent. All require explicit environment + approval-ticket arguments for production.

## What belongs here

- Shell scripts that touch deployed infrastructure (AWS, EKS, RDS, NATS, WORM)
- Scripts that runbooks invoke directly (`01-docs/04-ops/runbooks/*` should reference scripts here)
- Bootstrap / setup / migration scripts that are part of the deployment lifecycle
- Evidence-capture scripts run as part of incidents or releases

## What does NOT belong here

- CI validators / linters / dev-loop tooling → use [`03-platform/tools/03-platform/scripts/`](../../03-platform/tools/03-platform/scripts/README.md)
- Cross-repo coordination / agent-sync utilities → use [`03-platform/scripts/`](../../03-platform/scripts/README.md)
- Build steps internal to one workspace package → use that package's `package.json` scripts

## Contents

| Script                                                                           | Purpose                                                | Invoked by                                             |
| -------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| [`apply-platform-irsa.sh`](./apply-platform-irsa.sh)                             | Apply IRSA roles for platforms                         | Deploy runbook                                         |
| [`assemble-sandbox-evidence.sh`](./assemble-sandbox-evidence.sh)                 | Bundle sandbox-application evidence                    | GTM regulatory work                                    |
| [`bootstrap-aws.sh`](./bootstrap-aws.sh)                                         | One-time AWS account bootstrap                         | New-account onboarding                                 |
| [`bootstrap-staging.sh`](./bootstrap-staging.sh)                                 | Staging environment bootstrap                          | New staging spin-up                                    |
| [`build-push.sh`](./build-push.sh)                                               | Container image build + ECR push                       | CI release pipeline                                    |
| [`capture-rollback-evidence.sh`](./capture-rollback-evidence.sh)                 | Snapshot state for rollback evidence                   | Rollback runbook                                       |
| [`deploy.sh`](./deploy.sh)                                                       | Production canary deployment with approval-ticket gate | `01-docs/04-ops/runbooks/deploy.md`                    |
| [`dr-test.sh`](./dr-test.sh)                                                     | DR drill against staging                               | `01-docs/04-ops/runbooks/disaster-recovery.md`         |
| [`fine-tune-workflow.sh`](./fine-tune-workflow.sh)                               | ML fine-tune workflow orchestration                    | `01-docs/04-ops/runbooks/fine-tune-workflow-*.md`      |
| [`init-secrets.sh`](./init-secrets.sh)                                           | Initialize K8s secrets from AWS Secrets Manager        | New-environment setup                                  |
| [`migrate-state.sh`](./migrate-state.sh)                                         | Terraform state migration                              | `01-docs/04-ops/runbooks/terraform-state-migration.md` |
| [`migrate.sh`](./migrate.sh)                                                     | Database migration runner                              | `01-docs/04-ops/runbooks/migrate.md`                   |
| [`prepare-intelligence-evidence-env.sh`](./prepare-intelligence-evidence-env.sh) | Intelligence-engine evidence prep                      | Compliance evidence collection                         |
| [`purge-terraform-history.sh`](./purge-terraform-history.sh)                     | Filter Terraform binaries from git history             | One-time cleanup; do not re-run                        |
| [`seed.sh`](./seed.sh)                                                           | Seed databases with bootstrap data                     | Dev environment setup                                  |
| [`setup.sh`](./setup.sh)                                                         | Top-level environment bootstrap                        | New-environment setup                                  |
| [`test-audit-immutability.sh`](./test-audit-immutability.sh)                     | Fixture test for WORM Object Lock enforcement          | CI master-validation gate                              |
| [`validate.sh`](./validate.sh)                                                   | Quick + full infrastructure validation gates           | `pnpm test` / `pnpm test:full`                         |

## Conventions

- Bash only — for portability and to keep ops surfaces auditable from any shell
- Exit 0 on success, non-zero with human-readable error on failure
- Production destructive operations require `--approval-ticket=GTCX-NNN` argument
- Dry-run support (`--dry-run`) on every script that mutates state
- Logging via `set -x` opt-in, errors go to stderr
- Idempotent — running twice should not break or produce duplicate state

## Related

- [`03-platform/scripts/`](../../03-platform/scripts/README.md) — cross-repo automation + agent-sync
- [`03-platform/tools/03-platform/scripts/`](../../03-platform/tools/03-platform/scripts/README.md) — CI validators + dev tooling
