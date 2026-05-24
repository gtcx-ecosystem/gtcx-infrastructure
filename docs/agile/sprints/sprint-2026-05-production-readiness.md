---
title: 'Sprint: Production-Readiness Closure — May 2026'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['crypto', 'compliance', 'architecture', 'infrastructure', 'frontend']
review_cycle: 'on-change'
---

# Sprint: Production-Readiness Closure — May 2026

**Goal:** Close the 6 remaining trust-bearing audit gaps to move `gtcx-infrastructure` from 6.5 → 8+.

**Sprint duration:** 1 cycle (single-session burst)
**Definition of Done:** Each item has committed, tested, pushed code; CI passes.

---

## Backlog

| #   | Item                                 | Story Points | Acceptance Criteria                                                                                                                                                          | Status      |
| --- | ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | **DID signature stub — fail-closed** | 3            | `verifyDidSignature` returns `false` by default; env-var bypass explicitly required; integration tests updated; every bypass is auditable                                    | In Progress |
| 2   | **K8s probe gaps**                   | 1            | Verify `platform.yaml`, `intelligence-ingress.yaml`, `intelligence-shadow.yaml` are not Deployments; document why probes are N/A; confirm all actual Deployments have probes | In Progress |
| 3   | **Wire postgres-audit into K8s**     | 5            | `AUDIT_DATABASE_URL` plumbed into replay-guard via ConfigMap/Secret; audit schema migration SQL committed; postgres sink added to `AuditCapture`; CI validates migrations    | In Progress |
| 4   | **DR scripts exercised in CI**       | 3            | `.github/workflows/dr-test.yml` runs `dr-test.sh` on schedule + on-demand; evidence artifacts uploaded; failure notifies                                                     | In Progress |
| 5   | **Terraform binary CI gate**         | 2            | CI step rejects PRs containing `.terraform/` or `*.tfstate`; runbook documents history purge via `git-filter-repo`                                                           | In Progress |
| 6   | **mTLS / service-mesh plan**         | 2            | Documented architecture decision in `docs/architecture/decisions/` with implementation phases; no committed binaries                                                         | In Progress |

---

## Burndown

- [x] DID stub fail-closed
- [x] K8s probes verified/documented
- [x] postgres-audit wired + migrations
- [x] DR test in CI
- [x] Terraform CI gate
- [x] mTLS/service-mesh plan

---

## Risks

- **DID resolver dependency:** `@gtcx/protocols-crypto` does not exist in this repo. Mitigation: fail-closed stub with explicit bypass.
- **Terraform history purge:** Requires `git-filter-repo` which rewrites history. Mitigation: document runbook; do not execute automatically in CI.
- **postgres-audit networking:** StatefulSet uses `ClusterIP`; services in `gtcx` namespace can reach it via `gtcx-postgres-audit.gtcx.svc.cluster.local:5432`.
