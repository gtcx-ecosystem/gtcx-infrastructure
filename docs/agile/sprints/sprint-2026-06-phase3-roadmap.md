---
title: 'Sprint Phase 3 — June 2026: Hardening + External Readiness'
date: 2026-06-04
owner: gtcx-infrastructure
role: platform-architect
frame: development
tier: critical
tags: ['sprint', 'roadmap', 'hardening', 'audit', 'zwcmp']
review_cycle: weekly
---

# Sprint Phase 3 — June 2026: Hardening + External Readiness

> **Reconciled from:** execution-roadmap-2026-06-01, master-audit-2026-06-02, 10-10-roadmap-2026-06-02, cross-repo-sprint-workplan-2026-06, INF-86 ceremony tracker, and session forensic review 2026-06-04.
>
> **Completed this session:** XR-405 sovereign KMS signing, compliance-gateway deploy unblock, IR-2.2 AI SDK v6 migration.

---

## Sprint 1: Infra Hardening (2026-06-04 → 2026-06-11)

**Goal:** Close every P1 engineering gap surfaced in the 2026-06-02 audit and the forensic review. No external blockers.

| Story | Title                                                                 | Priority | Status    | Owner | Acceptance                                                                    |
| ----- | --------------------------------------------------------------------- | -------- | --------- | ----- | ----------------------------------------------------------------------------- |
| S1-01 | **Kustomize selector immutability** — sovereign deployment full apply | P1       | `pending` | infra | `kubectl apply -k overlays/staging` exits 0                                   |
| S1-02 | **TypeORM entity/schema drift** — reconcile with `01-schema.sql`      | P1       | `pending` | infra | Diff between TypeORM entities and canonical DDL is empty                      |
| S1-03 | **ioredis missing** — add to sovereign production image               | P1       | `pending` | infra | `ioredis` in `package.json` prod deps; Redis nonce store connects             |
| S1-04 | **AUDIT_SEAL_SECRET missing** — sovereign staging secret              | P1       | `pending` | infra | `gtcx-sovereign-secrets-staging` contains `AUDIT_SEAL_SECRET` ≥32 chars       |
| S1-05 | **Terraform drift** — staging IRSA role in state                      | P1       | `pending` | infra | `module.irsa_platform` in staging `main.tf`; `terraform plan` shows 0 changes |
| S1-06 | **Production IRSA trust cleanup** — remove stale staging ref          | P2       | `pending` | infra | `gtcx-production-platforms-irsa` trust policy has no staging SA references    |
| S1-07 | **Kustomize secret collision pattern** — base cleanup                 | P2       | `pending` | infra | Base `secretGenerator` `compliance-gateway-audit-key` removed or disabled     |
| S1-08 | **ER-1-08 infra hub log row** — protocols ack                         | P2       | `pending` | infra | `docs/operations/coordination/` contains ER-1-08 infra ack doc                |
| S1-09 | **Lint debt** — compliance-gateway ESLint + script                    | P1       | `pending` | infra | `pnpm lint` in compliance-gateway exits 0; 34 errors resolved                 |
| S1-10 | **Coverage honesty** — file-level coverage, no smoothing              | P1       | `pending` | infra | Coverage report shows per-file branch %; no aggregate-only claims             |

### Sprint 1 Dependencies

- None external. All infra-owned.

---

## Sprint 2: Security + Production Hardening (2026-06-11 → 2026-06-18)

**Goal:** Ship security surface required for pen-test and SOC 2 readiness. Unblock PRD-002 production path.

| Story | Title                                                                               | Priority | Status    | Owner             | Acceptance                                                                     |
| ----- | ----------------------------------------------------------------------------------- | -------- | --------- | ----------------- | ------------------------------------------------------------------------------ |
| S2-01 | **Secret scanning CI** — TruffleHog or equivalent, zero live secrets                | P1       | `pending` | devops            | `validate-all.mjs` gate passes; zero secrets in scan output                    |
| S2-02 | **Rate limiting** — `/audit/bundles` + `/audit/query` with load-test                | P1       | `pending` | infra             | Load-test evidence shows throttle at configured RPS                            |
| S2-03 | **FIPS 140-3 feature flag** — compiles, tests pass                                  | P1       | `pending` | security          | `GTCX_FIPS_MODE=1` build passes; unit tests green                              |
| S2-04 | **PRD-002 Tier B** — TradePass DID resolver contract alignment                      | P1       | `blocked` | protocols + infra | Protocols decision on `/identity/:did` shape; compliance-gateway consumes it   |
| S2-05 | **Mutable audit default path** — stdout → NATS/WORM or persistent sink              | P1       | `pending` | infra             | `AUDIT_SINK` env routes to durable sink; no stdout default in production       |
| S2-06 | **SLSA Build L3** — sigstore attestation on ≥1 package                              | P2       | `pending` | devops            | Published package has `.sigstore` attestation artifact                         |
| S2-07 | **Pen-test SOW signature push** (EXT-INF-002)                                       | P0       | `pending` | leadership        | SOW signed; vendor kickoff scheduled                                           |
| S2-08 | **SOC 2 Type I auditor engagement** (EXT-INF-013)                                   | P0       | `pending` | ciso + finance    | Auditor selected; gap analysis kickoff scheduled                               |
| S2-09 | **Durable offline queue** — survives restart + crash recovery                       | P1       | `pending` | infra             | Queue backend chosen (NATS JetStream vs Redis Streams); integration tests pass |
| S2-10 | **Runtime cross-repo integration tests** — protocols/core/intelligence health in CI | P1       | `pending` | infra             | CI job probes cross-repo health endpoints; fails on ≥1 down                    |

### Sprint 2 Dependencies

- S2-04 blocked on `gtcx-protocols` contract decision (TradePass DID resolver).
- S2-07 and S2-08 are human/gtm blockers; agent can only scaffold evidence.

---

## Sprint 3: GTM Unblock + ZWCMP Close (2026-06-18 → 2026-06-25)

**Goal:** Every external blocker has a named owner and a scheduled next action. ZWCMP pilot has a signed agreement.

| Story | Title                                                                        | Priority | Status       | Owner            | Acceptance                                                            |
| ----- | ---------------------------------------------------------------------------- | -------- | ------------ | ---------------- | --------------------------------------------------------------------- |
| S3-01 | **ZWCMP owner assignment + first cadence call** (S1-09 carry)                | P0       | `scaffolded` | leadership       | Named owner in `pilot-success-criteria.md`; calendar invite confirmed |
| S3-02 | **ZWCMP DPA + pilot agreement signature** (EXT-INF-014 / S3-11)              | P0       | `pending`    | founder/gtm      | Signed agreement committed to `docs/audit/`                           |
| S3-03 | **Indemnified-SLA legal review + insurance quote** (EXT-INF-015 / S3-08)     | P1       | `pending`    | legal/gtm        | Legal memo + insurance quote in `docs/gtm/`                           |
| S3-04 | **Publish primitives** — `@gtcx/audit-signer`, `terraform-aws-compliance-db` | P2       | `pending`    | devops           | Packages public on npm + Terraform Registry with provenance           |
| S3-05 | **FSCA license / SARB notification** — begin filing                          | P1       | `pending`    | compliance       | Filing receipt or submission confirmation                             |
| S3-06 | **CISO/vCISO appointment** — named and board reporting established           | P1       | `pending`    | ceo/board        | Appointment letter + monthly board report template                    |
| S3-07 | **DR live RDS restore** — operator-run with evidence                         | P2       | `pending`    | platform         | Screenshot + log of live restore committed to `docs/audit/`           |
| S3-08 | **Cloudflare Tunnel migration completion** — `api.gtcx.trade`                | P2       | `pending`    | infra            | Tunnel routes confirmed; old ALB ingress deprecated                   |
| S3-09 | **XR-507 verifier DNS** — `verify.explorationos.gtcx.trade`                  | P2       | `blocked`    | cloudflare admin | DNS record live; Terraform state matches                              |
| S3-10 | **XR-508 Supabase unpause** — prod migrations                                | P2       | `blocked`    | ops              | Project unpaused; migrations 006+007 applied                          |

### Sprint 3 Dependencies

- S3-01, S3-02, S3-03, S3-06 are human/gtm decisions.
- S3-09 blocked on Cloudflare OAuth token with `zone:write`.
- S3-10 blocked on ops dashboard access.

---

## Cross-Repo Coordination Register

| ID      | Title                          | Status   | Blocker                                                   | Sprint     |
| ------- | ------------------------------ | -------- | --------------------------------------------------------- | ---------- |
| XR-102  | Mobile audit E2E               | ready    | —                                                         | S2         |
| XR-303  | Platforms consume `@gtcx/ui`   | blocked  | ledger-ui NPM_TOKEN                                       | S3         |
| XR-401  | INF-86 algorithm decision      | blocked  | CISO sign-off                                             | S1 (input) |
| XR-402  | INF-86 pilot ceremony          | hold     | XR-401 + custodians                                       | S2         |
| XR-403  | `bog.json` production key      | blocked  | XR-402 SPKI handoff                                       | S2         |
| XR-404  | exploration-os `contract:gtcx` | blocked  | XR-403                                                    | S3         |
| XR-405  | Platforms KMS wire-up          | **done** | —                                                         | —          |
| XR-507  | Verifier DNS                   | blocked  | CF OAuth `zone:write`                                     | S3         |
| XR-508  | Supabase migrations            | blocked  | Paused project                                            | S3         |
| XR-509  | Publish `@gtcx/mcp`            | blocked  | NPM credentials                                           | S3         |
| XR-510  | ledger-ui `@gtcx/ui@0.4.1`     | blocked  | NPM_TOKEN                                                 | S3         |
| XR-517  | SPEC §17 co-author sign-off    | blocked  | Human sign-off                                            | S2         |
| ER-2    | Cost router production         | pending  | infra ENABLE_COST_ROUTER + intel proof + baseline-os v1.1 | S2         |
| ER-1-08 | Hub acks                       | pending  | gtcx-core + gtcx-infra log rows                           | S1         |

---

## Deferred to Next Quarter

| Item                                       | Reason                                    |
| ------------------------------------------ | ----------------------------------------- |
| SOC 2 Type II (6-month observation)        | Long lead; scaffolding sufficient for now |
| ISO 27001                                  | Same horizon as SOC 2; not ZWCMP-gated    |
| PCI-DSS scoping                            | No card-data path in scope                |
| Multi-region active-active (eu-west-1)     | Premature before single-region evidence   |
| HSM / AWS KMS asymmetric signing migration | High-cost; not regulator-sandbox blocker  |
| Edge node deployment (Ghana, Kenya)        | Post-pilot infrastructure                 |

---

## How to Update This File

- Mark stories `pending | in_progress | blocked | done` as you go.
- Acceptance commands must pass before `done`.
- Reconcile weekly against `docs/audit/execution-roadmap.md` and `docs/audit/master-audit-*.md`.
- Cross-repo updates go in `docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md`.
