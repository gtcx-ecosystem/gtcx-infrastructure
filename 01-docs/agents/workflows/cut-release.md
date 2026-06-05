---
title: 'Task Playbook: Apply an Infrastructure Change'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'compliance', 'infrastructure', 'api', 'frontend']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Task Playbook: Apply an Infrastructure Change

**Owner:** DevOps engineer (gates + approval) + Lead engineer (sign-off)
**Safety tier:** Requires human approval before applying to any environment

---

## When to Run This

Run when infrastructure changes are ready to be applied — Terraform modules, Kubernetes manifests, Docker configurations, migrations, or CI/CD pipelines.

Infrastructure changes are not package publishes. There is no npm release. "Releasing" infra means applying reviewed IaC changes to an environment. Every environment tier (staging, production) requires explicit confirmation before apply.

---

## Pre-Flight

Confirm with the human reviewer:

- Which environment: `staging` or `production`
- Which components are changing (Terraform modules, K8s manifests, Docker services, migrations)
- Whether the change is destructive (resource deletion, DB schema change, cluster config modification)
- Whether a rollback plan exists and has been reviewed

Then read:

- `01-docs/devops/release/release-checklist.md` — authoritative gate list
- `01-docs/01-agents/workflows/safety-rules.md` — three-tier authority structure

---

## Gate Sequence

Execute in order. Do not proceed past a failing gate.

### Gate 1 — Script quality

```bash
pnpm lint
pnpm format:check
pnpm typecheck
```

All Node.js automation scripts must pass lint and type checking. Zero warnings.

---

### Gate 2 — Build

```bash
pnpm build
```

All automation tooling builds cleanly.

---

### Gate 3 — Docker validation (if container changes)

```bash
docker compose build
```

All images build without error. Review image sizes for regressions.

---

### Gate 4 — IaC dry-run (Terraform)

If Terraform modules changed:

```bash
terraform init
terraform validate
terraform plan -out=plan.tfplan
```

Review the plan output carefully:

- No unexpected resource deletions
- No changes to `gtcx_audit` database — this is append-only and must never be modified
- Resource counts match expected scope

Do not run `terraform apply` yet.

---

### Gate 5 — Manifest validation (Kubernetes)

If K8s manifests changed:

```bash
kubectl diff -f <manifest>
```

Or use `helm diff` for Helm-managed resources. Review the diff — do not apply yet.

---

### Gate 6 — Migration review (if DB migrations)

If database migrations are included:

- Confirm migration is forward-only (no destructive rollback that drops columns/tables)
- Confirm migration does not touch `gtcx_audit` (append-only, never modified)
- Confirm migration has been reviewed by a second engineer

---

## Escalation

Surface to the human reviewer before applying:

1. Gate results (all pass / any failures)
2. Summary of what will change in the target environment
3. Any resource deletions or destructive operations
4. Any migration changes
5. Rollback plan

Do not proceed without explicit confirmation.

---

## After Human Approval

### Step 1 — Apply to staging first

Apply the change to staging and verify behavior before production.

```bash
# Terraform (with ticket)
terraform apply --approval-ticket=GTCX-XXX plan.tfplan

# Kubernetes
kubectl apply -f <manifest> --approval-ticket=GTCX-XXX

# Docker
docker compose up -d
```

### Step 2 — Verify in staging

Confirm the expected state is reached:

- Services are healthy
- No unexpected resource changes
- Monitoring shows no regressions

### Step 3 — Apply to production

Only after staging verification passes and human explicitly confirms production apply.

---

## Post-Flight

- [ ] All gates passed
- [ ] Human confirmation received with approval ticket
- [ ] Applied to staging and verified
- [ ] Applied to production (if in scope)
- [ ] Terraform state committed (if applicable)
- [ ] Change documented in incident log if any unexpected behavior occurred

---

## Hard Rules

- Never apply to production without explicit human confirmation and `--approval-ticket=GTCX-XXX`
- Never run destructive operations (drop DB, delete cluster resources) without explicit user instruction
- Never modify a migration that has already run in any environment
- Never cross-write or merge `gtcx_audit` into `gtcx_development` or vice versa
- Never commit secrets, API keys, or credentials to any file
- Never use `--no-verify`
- Never push to `main` without explicit instruction

---

## Reference

- [`01-docs/devops/release/release-checklist.md`](../../operations/release/release-checklist.md) — release checklist
- [`01-docs/devops/ci-cd/ci-cd.md`](../../operations/ci-cd/ci-cd.md) — CI/CD pipeline reference
- [`01-docs/01-agents/workflows/safety-rules.md`](agent-safety-rules.md) — approval requirements and three-tier authority
