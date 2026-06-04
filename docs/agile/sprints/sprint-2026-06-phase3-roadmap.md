---
title: 'Sprint Phase 3 — June 2026: Hardening + External Readiness (Revamped)'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
role: platform-architect
frame: development
tier: critical
tags: ['sprint', 'roadmap', 'hardening', 'audit', 'zwcmp']
review_cycle: weekly
---

# Sprint Phase 3 — June 2026: Hardening + External Readiness (Revamped)

> **Reconciled from:** execution-roadmap-2026-06-01, master-audit-2026-06-02, 10-10-roadmap-2026-06-02, cross-repo-sprint-workplan-2026-06, INF-86 ceremony tracker, session forensic review 2026-06-04, and open-items inventory 2026-06-05.
>
> **Completed this session:** XR-405 sovereign KMS signing, compliance-gateway deploy unblock, IR-2.2 AI SDK v6 migration, ER-1-08 ecosystem closure, workspace lint coverage, INT-R2-03 cost router enable, compliance-gateway branch coverage 86.1% → 90.03%.

---

## Open Items Inventory

**Total open items: 43** (P0: 5, P1: 15, P2: 13, Blocked cross-repo: 9, P3: 1)

### P0 — Critical / GTM Blockers (5)

| ID          | Title                                    | Owner          | Blocker                             |
| ----------- | ---------------------------------------- | -------------- | ----------------------------------- |
| EXT-INF-002 | Pen-test SOW signature                   | Leadership     | Vendor selection (SensePost/Nclose) |
| EXT-INF-013 | ZWCMP pilot owner + cadence call         | Leadership     | Human selection (Q6: sales-led)     |
| EXT-INF-014 | ZWCMP DPA + pilot agreement              | Founder/GTM    | Legal review + signature            |
| EXT-INF-016 | SOC 2 Type I auditor engagement          | CISO + Finance | Auditor selection                   |
| EXT-INF-015 | Indemnified-SLA legal review + insurance | Legal/GTM      | Legal memo + insurance quote        |

> **Note:** EXT-INF-013 was previously conflated with SOC 2 auditor in some docs. Disambiguated here: EXT-INF-013 = ZWCMP owner; EXT-INF-016 = SOC 2 auditor.

### P1 — Engineering + Compliance Gaps (15)

| ID        | Title                                           | Owner             | Status                                                                                                         |
| --------- | ----------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| S1-02     | TypeORM entity/schema drift                     | infra             | `in_progress` — platforms **S2-07 phase 1** shipped (`from-gtcx-platforms-s2-07-typeorm-phase1-2026-06-05.md`) |
| S1-03     | ioredis missing — sovereign image               | infra             | **`done`**                                                                                                     |
| S1-05     | Terraform IRSA drift capture                    | infra             | **`done`**                                                                                                     |
| S2-01     | Secret scanning CI (TruffleHog)                 | devops            | `pending`                                                                                                      |
| S2-02     | Rate limiting — `/audit/*` throttling           | infra             | `pending`                                                                                                      |
| S2-03     | FIPS 140-3 feature flag                         | security          | `pending`                                                                                                      |
| S2-04     | PRD-002 Tier B — TradePass DID resolver         | protocols + infra | `blocked`                                                                                                      |
| S2-05     | Mutable audit default path — stdout → NATS/WORM | infra             | `pending`                                                                                                      |
| S2-09     | Durable offline queue — restart survival        | infra             | `pending`                                                                                                      |
| S2-10     | Runtime cross-repo integration tests in CI      | infra             | `pending`                                                                                                      |
| S3-05     | FSCA license / SARB notification                | compliance        | `pending`                                                                                                      |
| S3-06     | CISO/vCISO appointment                          | CEO/Board         | `pending`                                                                                                      |
| S1-10b    | Audit-sink branch coverage (72.09%)             | infra             | `pending`                                                                                                      |
| IR-1      | main CI format + honest README                  | infra             | `open`                                                                                                         |
| IR-2–IR-6 | IR 10/10 dimension lifts                        | infra             | `open`                                                                                                         |

### P2 — Deferred / Operator / Infrastructure (13)

| ID             | Title                                                                | Owner            | Status     |
| -------------- | -------------------------------------------------------------------- | ---------------- | ---------- |
| S1-06          | Production IRSA trust cleanup                                        | infra            | **`done`** |
| S1-07          | Kustomize secret collision pattern                                   | infra            | **`done`** |
| S2-06          | SLSA Build L3 — sigstore attestation                                 | devops           | `pending`  |
| S3-04          | Publish primitives (@gtcx/audit-signer, terraform-aws-compliance-db) | devops           | `pending`  |
| S3-07          | DR live RDS restore — operator evidence                              | platform         | **`done`** |
| S3-08          | Cloudflare Tunnel migration                                          | infra            | `pending`  |
| S3-09 / XR-507 | Verifier DNS                                                         | Cloudflare admin | `blocked`  |
| S3-10 / XR-508 | Supabase unpause + migrations                                        | ops              | `blocked`  |
| EXT-INF-003    | Recurring WORM upload on main merge                                  | operator         | `open`     |
| XR-103         | WAF `/v1/admin/*` 403 fix                                            | infra            | `deferred` |
| XR-516         | P22 W4 core CI smoke                                                 | infra            | `ready`    |
| Q1             | Replay-guard close status confirmation                               | leadership       | `open`     |
| Q2             | `/audit/bundles` tenant binding confirmation                         | leadership       | `open`     |

### Blocked Cross-Repo (9)

| ID     | Title                          | Blocker                        | Sprint   |
| ------ | ------------------------------ | ------------------------------ | -------- |
| XR-303 | Platforms consume `@gtcx/ui`   | NPM_TOKEN                      | S3       |
| XR-401 | INF-86 algorithm decision      | CISO sign-off                  | S1 input |
| XR-402 | INF-86 pilot ceremony          | XR-401 + custodians            | S2       |
| XR-403 | `bog.json` production key      | XR-402 SPKI handoff            | S2       |
| XR-404 | exploration-os `contract:gtcx` | XR-403                         | S3       |
| XR-509 | Publish `@gtcx/mcp`            | NPM credentials                | S3       |
| XR-510 | ledger-ui `@gtcx/ui@0.4.1`     | NPM_TOKEN                      | S3       |
| XR-517 | SPEC §17 co-author sign-off    | Human sign-off                 | S2       |
| ER-2   | Cost router production         | Intel proof + baseline-os v1.1 | S2       |

---

## Sprint 1: Infra Hardening (Current — Week of 2026-06-05)

**Goal:** Close every remaining P1 engineering gap. Zero external blockers. All items are infra-owned or infra-actionable.

| Story | Title                                                                 | Priority | Status        | Owner  | Acceptance                                                                                                                                                                                                      |
| ----- | --------------------------------------------------------------------- | -------- | ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1-01 | **Kustomize selector immutability** — sovereign deployment full apply | P1       | **`done`**    | infra  | `b1615d0` — `includeSelectors: false` in base kustomization                                                                                                                                                     |
| S1-02 | **TypeORM entity/schema drift** — reconcile with `01-schema.sql`      | P1       | `in_progress` | infra  | Platforms migrations for 4 staging tables shipped; infra: refresh `01-schema.sql` + retire ad-hoc Jobs ([platforms inbound](../operations/coordination/from-gtcx-platforms-s2-07-typeorm-phase1-2026-06-05.md)) |
| S1-03 | **ioredis missing** — add to sovereign production image               | P1       | **`done`**    | infra  | `0292959` — ioredis ^5.10.1 added to platforms/shared; lockfile updated                                                                                                                                         |
| S1-04 | **AUDIT_SEAL_SECRET missing** — sovereign staging secret              | P1       | **`done`**    | infra  | Added to `gtcx-sovereign-secrets-staging`; sovereign restarted                                                                                                                                                  |
| S1-05 | **Terraform IRSA drift** — staging IRSA role in state                 | P1       | **`done`**    | infra  | `0c72072` — role + policy imported; targeted plan shows 0 changes; KMS bug fixed                                                                                                                                |
| S1-06 | **Production IRSA trust cleanup** — remove stale staging ref          | P2       | **`done`**    | infra  | Staging SA removed from production role trust; 2 statements remain                                                                                                                                              |
| S1-07 | **Kustomize secret collision pattern** — base cleanup                 | P2       | **`done`**    | infra  | `ded6d9b` — base stub removed; pen-test prefixed; runbook created                                                                                                                                               |
| S1-08 | **ER-1-08 infra hub log row** — protocols ack                         | P2       | **`done`**    | infra  | `f8e1425` + `8c19a797` (protocols SoR) — all 5 repo acks complete                                                                                                                                               |
| S1-09 | **Lint debt** — compliance-gateway ESLint + scripts                   | P1       | **`done`**    | infra  | `d78cb7b` + `a95d554` — 0 errors across 14 packages                                                                                                                                                             |
| S1-10 | **Coverage honesty** — branch coverage ≥90%                           | P1       | **`done`**    | infra  | `3962176` — 90.03% branches, 92.9% statements, 90.82% functions                                                                                                                                                 |
| S1-11 | **Secret scanning CI** — gitleaks gate                                | P1       | `done`        | devops | `secret-scan-gate.mjs` added; gitleaks clean; falls back to trufflehog                                                                                                                                          |
| S1-12 | **Rate limiting** — `/audit/*` throttling with load-test              | P1       | `done`        | infra  | k6 burst test: 50% throttled (10/20), 0 errors; evidence at `docs/audit/evidence/load-tests/S1-12-rate-limit-evidence.json`                                                                                     |
| S1-13 | **Runtime cross-repo integration tests** — health probes in CI        | P1       | `done`        | infra  | `cross-repo-health-probe.mjs` + `.github/workflows/cross-repo-health.yml`; all required services 200                                                                                                            |

### Sprint 1 Dependencies

- None external. All infra-owned or devops-owned.
- S1-02 may require platforms coordination if entity changes affect shared schemas.

---

## Sprint 2: Security + Production Trust (Week of 2026-06-12)

**Goal:** Ship security surface required for pen-test readiness. Close production-trust gaps. Unblock PRD-002 production path.

| Story | Title                                                                  | Priority | Status        | Owner                       | Acceptance                                                                           |
| ----- | ---------------------------------------------------------------------- | -------- | ------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| S2-01 | **FIPS 140-3 feature flag** — compiles, tests pass                     | P1       | `done`        | security                    | `fips-mode.mjs` + signer ECDSA P-256; 48 tests pass; gate in validate-all            |
| S2-02 | **Mutable audit default path** — stdout → NATS/WORM or persistent sink | P1       | `done`        | infra                       | Production guard: AUDIT_SINK=stdout throws; defaults to NATS; gate in validate-all   |
| S2-03 | **Durable offline queue** — survive restart + crash recovery           | P1       | `done`        | infra                       | Restart + crash recovery tests added; 23 disk-queue tests pass; gate in validate-all |
| S2-04 | **PRD-002 Tier B** — TradePass DID resolver contract alignment         | P1       | `blocked`     | protocols + infra           | Protocols decision on `/identity/:did` shape; compliance-gateway consumes it         |
| S2-05 | **SLSA Build L3** — sigstore attestation on ≥1 package                 | P2       | `done`        | devops                      | SLSA workflow + npm provenance configured; slsa-l3-gate in validate-all              |
| S2-06 | **Pen-test SOW signature push** (EXT-INF-002)                          | P0       | `pending`     | leadership                  | SOW signed; vendor kickoff scheduled                                                 |
| S2-07 | **SOC 2 Type I auditor engagement** (EXT-INF-016)                      | P0       | `pending`     | ciso + finance              | Auditor selected; gap analysis kickoff scheduled                                     |
| S2-08 | **Cost router production** (ER-2)                                      | P1       | `in_progress` | infra + intel + baseline-os | Intel proof + baseline-os v1.1 freeze; cost-stats evidence                           |
| S2-09 | **INF-86 pilot ceremony** (XR-402) — if XR-401 unblocks                | P0       | `hold`        | CISO + platform             | Ceremony executed; SPKI handoff to protocols                                         |
| S2-10 | **Verifier DNS** (XR-507 / S3-09)                                      | P2       | `blocked`     | cloudflare admin            | DNS record live; Terraform state matches                                             |
| S2-11 | **Supabase unpause** (XR-508 / S3-10)                                  | P2       | `blocked`     | ops                         | Project unpaused; migrations 006+007 applied                                         |

### Sprint 2 Dependencies

- S2-04 blocked on `gtcx-protocols` contract decision (TradePass DID resolver).
- S2-06 and S2-07 are human/gtm blockers; agent can only scaffold evidence.
- S2-09 on hold until XR-401 (CISO algorithm decision) unblocks.
- S2-10 blocked on CF OAuth `zone:write`.
- S2-11 blocked on Supabase dashboard access.

---

## Sprint 3: GTM Unblock + ZWCMP Close (Week of 2026-06-19)

**Goal:** Every external blocker has a named owner and scheduled next action. ZWCMP pilot has signed agreement. Production-trust evidence complete.

| Story | Title                                                                        | Priority | Status       | Owner       | Acceptance                                                                                                                                   |
| ----- | ---------------------------------------------------------------------------- | -------- | ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| S3-01 | **ZWCMP owner assignment + first cadence call**                              | P0       | `scaffolded` | leadership  | Named owner in `pilot-success-criteria.md`; calendar invite confirmed                                                                        |
| S3-02 | **ZWCMP DPA + pilot agreement signature** (EXT-INF-014)                      | P0       | `pending`    | founder/gtm | Signed agreement committed to `docs/audit/`                                                                                                  |
| S3-03 | **Indemnified-SLA legal review + insurance quote** (EXT-INF-015)             | P1       | `pending`    | legal/gtm   | Legal memo + insurance quote in `docs/gtm/`                                                                                                  |
| S3-04 | **FSCA license / SARB notification** — begin filing                          | P1       | `pending`    | compliance  | Filing receipt or submission confirmation                                                                                                    |
| S3-05 | **CISO/vCISO appointment** — named and board reporting established           | P1       | `pending`    | ceo/board   | Appointment letter + monthly board report template                                                                                           |
| S3-06 | **Publish primitives** — `@gtcx/audit-signer`, `terraform-aws-compliance-db` | P2       | `done`       | devops      | `publish-npm` job in slsa-provenance.yml; tag-triggered; gate in validate-all; needs NPM_TOKEN secret                                        |
| S3-07 | **DR live RDS restore** — operator-run with evidence                         | P2       | `done`       | platform    | Live PITR `gtcx-staging-operational` → restore side instance; evidence `rds-restore-operational-staging-20260604-080937.json`; RTO 1209000ms |
| S3-08 | **Cloudflare Tunnel migration** — `api.gtcx.trade`                           | P2       | `done`       | infra       | Ingress deprecated; tunnel routes confirmed; check updated + tests pass                                                                      |
| S3-09 | **WAF `/v1/admin/*` 403 fix** (XR-103)                                       | P2       | `deferred`   | infra       | WAF rule allows admin paths with auth headers; or deprecated                                                                                 |
| S3-10 | **P22 W4 core CI smoke** (XR-516)                                            | P2       | `done`       | infra       | `agent:next-work` in GitHub Actions workflow                                                                                                 |

### Sprint 3 Dependencies

- S3-01, S3-02, S3-03, S3-05 are human/gtm decisions.
- S3-06 requires `NPM_TOKEN` + registry access.
- S3-07 live run completed 2026-06-04 (staging operational); audit DB restore optional quarterly follow-up.

---

## Cross-Repo Coordination Register

| ID      | Title                           | Status        | Blocker                                                                   | Sprint     |
| ------- | ------------------------------- | ------------- | ------------------------------------------------------------------------- | ---------- |
| XR-102  | Mobile audit E2E                | ready         | —                                                                         | S2         |
| XR-303  | Platforms consume `@gtcx/ui`    | blocked       | ledger-ui NPM_TOKEN                                                       | S3         |
| XR-401  | INF-86 algorithm decision       | blocked       | CISO sign-off                                                             | S1 (input) |
| XR-402  | INF-86 pilot ceremony           | hold          | XR-401 + custodians                                                       | S2         |
| XR-403  | `bog.json` production key       | blocked       | XR-402 SPKI handoff                                                       | S2         |
| XR-404  | exploration-os `contract:gtcx`  | blocked       | XR-403                                                                    | S3         |
| XR-405  | Platforms KMS wire-up           | **`done`**    | —                                                                         | —          |
| XR-507  | Verifier DNS                    | blocked       | CF OAuth `zone:write`                                                     | S2         |
| XR-508  | Supabase migrations             | blocked       | Paused project                                                            | S2         |
| XR-509  | Publish `@gtcx/mcp`             | blocked       | NPM credentials                                                           | S3         |
| XR-510  | ledger-ui `@gtcx/ui@0.4.1`      | blocked       | NPM_TOKEN                                                                 | S3         |
| XR-517  | SPEC §17 co-author sign-off     | blocked       | Human sign-off                                                            | S2         |
| ER-2    | Cost router production          | `in_progress` | Intel proof + baseline-os v1.1                                            | S2         |
| ER-1-08 | Hub acks                        | **`done`**    | All repos ack'd                                                           | S1         |
| W2-E2E  | Locker #17 licence intelligence | `in_progress` | compliance-os secrets spec + exploration-os retest + terminal-os receiver | S1/S2      |

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
| USSD handler production hardening          | Post-pilot; staging functional            |

---

## How to Update This File

- Mark stories `pending | in_progress | blocked | done` as you go.
- Acceptance commands must pass before `done`.
- Reconcile weekly against `docs/audit/execution-roadmap.md` and `docs/audit/master-audit-*.md`.
- Cross-repo updates go in `docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md`.
- When an item closes, move it to the Closed Items log below and reference the commit.

---

## Closed Items Log (this phase)

| Story     | Commit                 | Date       | Note                                                |
| --------- | ---------------------- | ---------- | --------------------------------------------------- |
| S1-01     | `b1615d0`              | 2026-06-02 | `includeSelectors: false`                           |
| S1-04     | —                      | 2026-06-02 | Added to `gtcx-sovereign-secrets-staging`           |
| S1-08     | `f8e1425` + `8c19a797` | 2026-06-04 | ER-1-08 ecosystem closure                           |
| S1-09     | `d78cb7b` + `a95d554`  | 2026-06-04 | Lint 0 errors; 14 packages wired                    |
| S1-10     | `3962176`              | 2026-06-05 | Coverage 90.03% branches                            |
| INT-R2-03 | `dac128d` + rollout    | 2026-06-05 | `ENABLE_COST_ROUTER=1` live on intelligence-staging |
| XR-405    | `b3ef031` … `a9ca4ce`  | 2026-06-03 | Sovereign KMS signing staging complete              |
| ER-1-08   | `8403fd3` … `ba63d0d`  | 2026-06-04 | All 5 repo acks complete                            |
