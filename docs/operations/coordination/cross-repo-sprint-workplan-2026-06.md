---
title: 'Cross-repo sprint workplan — gtcx-infrastructure unified register'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
role: platform-engineer
document_id: INFRA-COORD-SPRINT-2026-06
sprint_horizon: 2026-06-03 → 2026-06-28
review_cycle: weekly
---

# Cross-repo sprint workplan — gtcx-infrastructure unified register

**Planning lens:** Ecosystem dependencies requiring gtcx-infrastructure action or blocked on infrastructure, reconciled across three parallel XR numbering schemes.  
**Canonical XR-### SoR:** [`gtcx-protocols/docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md`](../../../../gtcx-protocols/docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md)  
**Bridge (live):** [`cross-repo-agent-bridge.md`](cross-repo-agent-bridge.md) · **Log:** [`cross-repo-agent-log.md`](cross-repo-agent-log.md)

---

## XR scheme reconciliation

Three parallel numbering schemes exist across the ecosystem. This register adopts the **protocols scheme (XR-101+)** as canonical for infrastructure and maps others.

| Protocols (canonical) | Baseline (XR-001–025) | Agentic (XR-001–024) | Title                                          |
| --------------------- | --------------------- | -------------------- | ---------------------------------------------- |
| XR-060                | —                     | —                    | Authority DID staging (#60)                    |
| XR-101                | XR-001                | XR-001               | Staging operator DID + native protocols        |
| XR-102                | XR-003                | XR-003               | Mobile audit E2E                               |
| XR-103                | —                     | —                    | WAF/admin register-operator 403                |
| XR-201                | XR-002                | XR-002               | Intelligence-staging auth gate                 |
| XR-202                | XR-007                | XR-007               | INT-S3-08 full-stack re-smoke                  |
| XR-203                | —                     | —                    | Protocols mirror intelligence smoke JSON       |
| XR-301                | XR-004                | XR-004               | Push sovereign staging image (P4-07)           |
| XR-302                | XR-005                | XR-005               | Push AGX staging image + rollout               |
| XR-303                | —                     | —                    | Platforms consume `@gtcx/ui` portal primitives |
| XR-401                | —                     | —                    | INF-86 algorithm decision                      |
| XR-402                | XR-009 / XR-020       | XR-009               | INF-86 pilot KMS ceremony gh-bog               |
| XR-403                | —                     | —                    | Update `bog.json` production key               |
| XR-404                | —                     | —                    | exploration-os `contract:gtcx` post-pilot      |
| XR-405                | —                     | —                    | Platforms KMS sovereign signing wire-up        |
| XR-501                | XR-015                | XR-015               | exploration-os validators 0.5.0 import PR      |
| XR-502                | XR-010                | XR-010               | compliance-os W2 M2M intake (W2-C01)           |
| XR-503                | XR-011                | XR-011               | compliance-os W2 review webhook (W2-C02)       |
| XR-504                | W2-C03                | —                    | compliance-os diligence persist (W2-C03)       |
| XR-505                | —                     | —                    | terminal-os workflow Postgres (W2-T01)         |
| XR-506                | XR-014                | XR-014               | terra-os live permit adapters (W2-E01)         |
| XR-507                | XR-006                | XR-006               | exploration-os verifier prod deploy (F-33)     |
| XR-508                | XR-013                | XR-013               | exploration-os Supabase prod migrations        |
| XR-509                | —                     | —                    | Publish `@gtcx/mcp` npm                        |
| XR-510                | —                     | —                    | ledger-ui publish `@gtcx/ui@0.4.1`             |
| XR-511                | XR-017                | XR-017               | P22 W2 CI — compliance-os                      |
| XR-512                | XR-017                | XR-017               | P22 W2 CI — exploration-os                     |
| XR-513                | XR-017                | XR-017               | P22 W2 CI — gtcx-intelligence                  |
| XR-514                | XR-017                | XR-017               | P22 W2 CI — terminal-os                        |
| XR-515                | XR-017                | XR-017               | P22 W2 CI — gtcx-protocols                     |
| XR-516                | XR-017                | XR-017               | P22 W4 core — gtcx-infrastructure              |
| XR-517                | XR-019                | XR-019               | SPEC §17 co-author sign-off                    |
| XR-518                | —                     | —                    | INF-86 expand 43 authorities                   |

**Baseline-only items (no protocol equivalent):**

| Baseline | Title                                              | Owner                     | Status            |
| -------- | -------------------------------------------------- | ------------------------- | ----------------- |
| XR-008   | exploration-os re-audit F-33/H-F prod              | audit agent               | blocked on XR-507 |
| XR-012   | Audit v2 dual-output publish + ingest              | gtcx-docs, agentic, agile | in_progress       |
| XR-016   | Lender webhook owner + Supabase secrets            | TBD owner                 | blocked           |
| XR-018   | Protocol 24 coordination check in CI               | Tier-2 repos              | in_progress       |
| XR-021   | First sovereign ratification ceremony              | sovereign program         | open              |
| XR-022   | Pen-test vendor selection                          | Security / gtcx-core      | open              |
| XR-023   | Mobile attestation credentials                     | DevOps procurement        | open              |
| XR-024   | Signed design-partner LOI                          | Founder / GTM             | open              |
| XR-025   | Coordination folder gaps (terra-os, hardware, ops) | repo maintainers          | open              |

---

## Assessment key

| Status          | Meaning                                      |
| --------------- | -------------------------------------------- |
| **done**        | Acceptance met; no further cross-repo action |
| **ready**       | Unblocked; owner can start                   |
| **in-progress** | Active work in owning repo                   |
| **blocked**     | Waiting on named dependency                  |
| **deferred**    | Explicitly post-pilot / post-sprint          |
| **hold**        | Human-gated; do not proceed until sign-off   |

| Risk       | Meaning                                   |
| ---------- | ----------------------------------------- |
| **R-high** | Blocks multiple repos or production trust |
| **R-med**  | Blocks one consumer or staging path       |
| **R-low**  | Polish, docs, or parallel track           |

---

## Sprint map

| Sprint     | Dates (target)                | Theme                             | Exit criteria                                                         |
| ---------- | ----------------------------- | --------------------------------- | --------------------------------------------------------------------- |
| **S-XR-1** | 2026-06-03 → 06-07            | **Staging E2E close**             | Mobile audit E2E green; intelligence auth gate confirmed              |
| **S-XR-2** | 2026-06-08 → 06-14            | **Platforms staging + INT smoke** | Sovereign/AGX images live; INT-S3-08 evidence committed               |
| **S-XR-3** | 2026-06-15 → 06-21            | **INF-86 pilot (gh-bog)**         | Ceremony evidence + `bog.json` production + exploration-os regression |
| **S-XR-4** | 2026-06-08 → 06-28 (parallel) | **P25 W2 prod path**              | compliance-os M2M + webhook; terminal-os persist                      |
| **S-XR-5** | 2026-06-08 → 06-28 (parallel) | **P22 W2 CI wave**                | 4 P0 repos have `agent:next-work` in CI                               |

---

## Master dependency register

| Work ID | Title                                          | Owner               | Sprint      | Status       | Risk   | Depends on            | Blocks                                                                               |
| ------- | ---------------------------------------------- | ------------------- | ----------- | ------------ | ------ | --------------------- | ------------------------------------------------------------------------------------ |
| XR-060  | Authority DID staging (#60)                    | gtcx-protocols      | —           | **done**     | R-low  | INF-49                | —                                                                                    |
| XR-101  | Staging operator DID + native protocols        | gtcx-infrastructure | S-XR-1      | **done**     | R-high | protocols `6ef3b423+` | mobile E2E                                                                           |
| XR-102  | Mobile audit E2E (SM → env → smoke)            | gtcx-mobile         | S-XR-1      | **ready**    | R-high | XR-101                | MOBILE-AUDIT-01/02                                                                   |
| XR-103  | WAF/admin register-operator 403                | gtcx-infrastructure | S-XR-2      | **deferred** | R-low  | —                     | external admin curl                                                                  |
| XR-201  | Intelligence-staging auth gate                 | gtcx-infrastructure | S-XR-1      | **done**     | R-high | —                     | XR-202 unblocked; full SDK `12be5342` deployed; auth enforced on non-exempt paths    |
| XR-202  | INT-S3-08 full-stack re-smoke                  | gtcx-intelligence   | S-XR-2      | **done**     | R-high | —                     | protocols mirror                                                                     |
| XR-203  | Protocols mirror intelligence smoke JSON       | gtcx-protocols      | S-XR-2      | **deferred** | R-low  | XR-202                | —                                                                                    |
| XR-301  | Push sovereign staging image (P4-07)           | gtcx-platforms      | S-XR-2      | **done**     | R-med  | —                     | sovereign-staging.gtcx.trade/api/health 200; WAF `/api/*` rule applied               |
| XR-302  | Push AGX staging image + rollout               | gtcx-platforms      | S-XR-2      | **done**     | R-med  | —                     | api.staging.gtcx.trade/api/health 200; DB shared entities migrated; JWT secrets live |
| XR-303  | Platforms consume `@gtcx/ui` portal primitives | gtcx-platforms      | S-XR-2      | **blocked**  | R-med  | ledger-ui NPM_TOKEN   | regulator portals                                                                    |
| XR-401  | INF-86 algorithm decision                      | human (CISO)        | S-XR-3      | **blocked**  | R-high | —                     | XR-402–405                                                                           |
| XR-402  | INF-86 pilot KMS ceremony gh-bog               | gtcx-infrastructure | S-XR-3      | **hold**     | R-high | XR-401                | XR-403                                                                               |
| XR-403  | Update `bog.json` production key               | gtcx-protocols      | S-XR-3      | **blocked**  | R-high | XR-402                | #61, XR-404                                                                          |
| XR-404  | exploration-os `contract:gtcx` post-pilot      | exploration-os      | S-XR-3      | **blocked**  | R-low  | XR-403                | —                                                                                    |
| XR-405  | Platforms KMS sovereign signing wire-up        | gtcx-platforms      | S-XR-3      | **blocked**  | R-high | XR-403                | prod authority claims                                                                |
| XR-501  | exploration-os validators 0.5.0 import PR      | exploration-os      | S-XR-4      | **ready**    | R-low  | —                     | dedup schemas                                                                        |
| XR-502  | compliance-os W2 M2M intake (W2-C01)           | compliance-os       | S-XR-4      | **ready**    | R-med  | infra secret          | ExplorationOS export                                                                 |
| XR-503  | compliance-os W2 review webhook (W2-C02)       | compliance-os       | S-XR-4      | **ready**    | R-med  | terminal-os API       | export pipeline                                                                      |
| XR-504  | compliance-os diligence persist (W2-C03)       | compliance-os       | S-XR-4      | **ready**    | R-med  | —                     | prod restart                                                                         |
| XR-505  | terminal-os workflow Postgres (W2-T01)         | terminal-os         | S-XR-4      | **ready**    | R-med  | —                     | XR-503                                                                               |
| XR-506  | terra-os live permit adapters (W2-E01)         | terra-os            | S-XR-5      | **deferred** | R-high | P22 W4 core           | external diligence                                                                   |
| XR-507  | exploration-os verifier prod deploy (F-33)     | gtcx-infrastructure | S-XR-4      | **done**     | R-med  | —                     | H-F audit close                                                                      |
| XR-508  | exploration-os Supabase prod migrations        | gtcx-infrastructure | S-XR-4      | **done**     | R-med  | —                     | financing prod                                                                       |
| XR-509  | S11-03 publish `@gtcx/mcp` npm                 | gtcx-protocols      | S-XR-5      | **blocked**  | R-med  | NPM credentials       | consumers                                                                            |
| XR-510  | ledger-ui publish `@gtcx/ui@0.4.1`             | ledger-ui           | S-XR-2      | **blocked**  | R-med  | NPM_TOKEN             | XR-303                                                                               |
| XR-511  | P22 W2 CI — compliance-os                      | compliance-os       | S-XR-5      | **ready**    | R-low  | —                     | agent ergonomics                                                                     |
| XR-512  | P22 W2 CI — exploration-os                     | exploration-os      | S-XR-5      | **ready**    | R-low  | —                     | P25 smoke                                                                            |
| XR-513  | P22 W2 CI — gtcx-intelligence                  | gtcx-intelligence   | S-XR-5      | **ready**    | R-low  | —                     | agent ergonomics                                                                     |
| XR-514  | P22 W2 CI — terminal-os                        | terminal-os         | S-XR-5      | **ready**    | R-low  | —                     | P25 consumer                                                                         |
| XR-515  | P22 W2 CI — gtcx-protocols                     | gtcx-protocols      | S-XR-5      | **done**     | R-low  | —                     | agent ergonomics                                                                     |
| XR-516  | P22 W4 core — gtcx-infrastructure              | gtcx-infrastructure | S-XR-5      | **done**     | R-med  | —                     | long-term agents — P22/P26/P27 checks wired in CI                                    |
| XR-517  | SPEC §17 co-author sign-off                    | human               | —           | **blocked**  | R-high | Eng+Security          | Wire #2 ratification                                                                 |
| XR-518  | INF-86 expand 43 authorities                   | gtcx-infrastructure | post S-XR-3 | **deferred** | R-high | XR-402 pilot          | close #86                                                                            |

---

## Sprint S-XR-1 — Staging E2E close (2026-06-03 → 06-07)

### Goal

Close mobile staging audit path and confirm intelligence infra prerequisites.

### Work items

#### XR-101 — Staging operator DID (DONE)

| Field          | Value                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| **Assessment** | **done** — acceptance met 2026-06-03                                                                           |
| **Evidence**   | `GET /v1/tradepass/did:gtcx:tp_staging_e2e_001` → 200, `#k-1`, `x=OP743wqD8AUD2Vl05YGJ17fnNWUDIkQ1NRHrWTo4OuI` |
| **Repos**      | infra DONE doc; protocols `d06b928d`                                                                           |

#### XR-102 — Mobile audit E2E

| Field          | Value                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**      | gtcx-mobile                                                                                                                                                                              |
| **Assessment** | **ready** (only consumer action left)                                                                                                                                                    |
| **Plan**       | (1) Read SM `gtcx/staging/mobile-audit-e2e-credentials` (2) Populate `.env.staging.local` (3) `pnpm staging:pilot-smoke -- --e2e` + `staging:audit-e2e` (4) Mark MOBILE-AUDIT-01/02 done |
| **Acceptance** | E2E scripts exit 0; DID verify matches live `x`                                                                                                                                          |
| **Do not**     | Re-run `staging:audit-keygen` without DID re-seed                                                                                                                                        |

#### XR-201 — Intelligence auth gate

| Field          | Value                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**      | gtcx-infrastructure                                                                                                               |
| **Assessment** | **done** — full SDK `12be5342` deployed 2026-06-03                                                                                |
| **Plan**       | ✅ `module.secrets` applied; ✅ full SDK deployed; ✅ auth enforced on non-exempt paths; `/health` 200 by design (ALB/K8s probes) |
| **Acceptance** | `GET /policy/rules` → 401 without auth, 200 with key; `GET /feedback/stats` → 401 without auth, 200 with key                      |
| **Ping**       | ✅ Intelligence notified via agentic log + protocols log                                                                          |

---

## Sprint S-XR-2 — Platforms staging + intelligence smoke (2026-06-08 → 06-14)

### Goal

Restore platforms staging services; complete INT-S3-08 evidence chain.

### Work items

#### XR-202 — Intelligence re-smoke

| Field          | Value                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Owner**      | gtcx-intelligence + gtcx-agentic (runner)                                                                         |
| **Assessment** | **ready** — XR-201 done; full SDK live                                                                            |
| **Plan**       | `run-production-readiness-with-vault.mjs` → commit `deployment-smoke-*.json` → `pnpm check:eap-issuance-evidence` |
| **Acceptance** | INT-S3-08 marked done in execution roadmap                                                                        |

#### XR-301 / XR-302 — Platforms ECR

| Field          | Value                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| **Owner**      | gtcx-platforms → infra rollout                                                                       |
| **Assessment** | **ready** / **in-progress**                                                                          |
| **Plan**       | `pnpm docker:push:sovereign:staging`; `pnpm docker:push:agx:staging`; infra rollout; smoke URLs      |
| **Acceptance** | `sovereign-staging.gtcx.trade/health` not placeholder; `api.staging.gtcx.trade/api/health` 200       |
| **Infra ask**  | See [`to-gtcx-platforms-rollout-ready-2026-06-03.md`](to-gtcx-platforms-rollout-ready-2026-06-03.md) |

#### XR-303 / XR-510 — Portal primitives publish chain

| Field          | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| **Owner**      | ledger-ui (publish) → gtcx-platforms (integrate)                                              |
| **Assessment** | **blocked** on NPM_TOKEN                                                                      |
| **Plan**       | Human NPM_TOKEN → `pnpm release:publish` → platforms CRX/SGX/AGX refactor per outbound ticket |

---

## Sprint S-XR-3 — INF-86 pilot gh-bog (2026-06-15 → 06-21)

### Goal

First production sovereign authority key on `did:gtcx:auth:gh:bog`.

### Sequence (strict)

```
XR-401 (human algorithm)
  → XR-402 (infra ceremony + SPKI export)
  → XR-403 (protocols bog.json + evidence)
  → XR-404 (exploration-os contract:gtcx)
  → XR-405 (platforms KMS signing)
```

#### XR-403 — Protocols CSP update

| Field          | Value                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**      | gtcx-protocols                                                                                                                     |
| **Assessment** | **blocked**; **ready** after XR-402                                                                                                |
| **Plan**       | `kms-public-key-to-jwk.mjs` OR `--import-multibase` → `apply-production-authority-key.mjs` → CI checks → PR with ceremony evidence |
| **Runbook**    | `gtcx-protocols/.../inf-86-pilot-gh-bog-protocols-runbook-2026-06-02.md`                                                           |

#### XR-402 — Infra ceremony hold

| Field                  | Value                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| **Owner**              | gtcx-infrastructure                                                   |
| **Assessment**         | **hold** — DO NOT APPLY                                               |
| **Unblock conditions** | XR-401 sign-off + custodian scheduling + `GTCX-KEY-CEREMONY` approval |
| **Runbook**            | `docs/security/key-ceremony-runbook.md` §5.4                          |

---

## Sprint S-XR-4 — P25 W2 + exploration blockers (parallel)

### Goal

Move licence intelligence from staging fixtures toward production path.

| ID     | Owner               | Assessment | Deliverable                                |
| ------ | ------------------- | ---------- | ------------------------------------------ |
| XR-502 | compliance-os       | ready      | M2M bearer on diligence POST               |
| XR-503 | compliance-os       | ready      | Webhook on review accepted                 |
| XR-504 | compliance-os       | ready      | Postgres-backed diligence store            |
| XR-505 | terminal-os         | ready      | Postgres workflow tasks                    |
| XR-507 | gtcx-infrastructure | blocked    | `verify.explorationos.gtcx.trade/sir` live |
| XR-508 | gtcx-infrastructure | blocked    | Supabase migrations 006/007                |
| XR-501 | exploration-os      | ready      | Import validators evidence Zod             |

**Staging E2E path (already closed):** exploration-os fixture → compliance-os POST → terminal-os task — do not re-open unless regression.

---

## Sprint S-XR-5 — P22 agent ergonomics (parallel)

### Goal

`agent:next-work` smoke in CI for P0 repos per gtcx-docs hub.

| ID     | Repo                | Priority | Assessment                                |
| ------ | ------------------- | -------- | ----------------------------------------- |
| XR-511 | compliance-os       | P0       | ready                                     |
| XR-512 | exploration-os      | P0       | ready                                     |
| XR-513 | gtcx-intelligence   | P0       | ready                                     |
| XR-514 | terminal-os         | P0       | ready                                     |
| XR-516 | gtcx-infrastructure | P1       | **done** — P22/P26/P27 checks wired in CI |

**gtcx-protocols:** XR-515 P22 CI smoke **done** in workflow.

---

## Repo plans (condensed)

### gtcx-infrastructure

| Sprint | Work                       | Status                                    |
| ------ | -------------------------- | ----------------------------------------- |
| S-XR-1 | XR-201 intelligence auth   | done                                      |
| S-XR-2 | XR-301/302 rollout support | ready                                     |
| S-XR-3 | XR-402 ceremony            | hold                                      |
| S-XR-4 | XR-507/508                 | blocked                                   |
| S-XR-5 | XR-516 P22 W4 core         | **done** — P22/P26/P27 checks wired in CI |

### gtcx-protocols

| Sprint | Work                                        | Status   |
| ------ | ------------------------------------------- | -------- |
| S-XR-1 | Monitor XR-102; no code unless JWK mismatch | ready    |
| S-XR-2 | XR-203 optional mirror                      | deferred |
| S-XR-3 | XR-403                                      | blocked  |
| S-XR-5 | XR-509 `@gtcx/mcp` publish                  | blocked  |

### gtcx-mobile

| Sprint | Work        | Status |
| ------ | ----------- | ------ |
| S-XR-1 | XR-102 only | ready  |

### gtcx-intelligence

| Sprint  | Work                                       | Status |
| ------- | ------------------------------------------ | ------ |
| S-XR-2  | XR-202                                     | done   |
| In-repo | INT-S2-\*, INT-S4-01 via `agent:next-work` | ready  |

### exploration-os

| Sprint | Work                   | Status        |
| ------ | ---------------------- | ------------- |
| S-XR-3 | XR-404                 | blocked       |
| S-XR-4 | XR-501, XR-507 unblock | ready/blocked |

### gtcx-platforms

| Sprint | Work       | Status  |
| ------ | ---------- | ------- |
| S-XR-2 | XR-301/302 | ready   |
| S-XR-3 | XR-405     | blocked |

### compliance-os / terminal-os / terra-os

| Sprint | Work       | Status                   |
| ------ | ---------- | ------------------------ |
| S-XR-4 | XR-502–506 | ready / deferred (terra) |

### gtcx-agentic

| Sprint  | Work                                  | Status |
| ------- | ------------------------------------- | ------ |
| S-XR-2  | Vault smoke runner after XR-201       | ready  |
| Ongoing | `agent:coordination:check`, audit hub | done   |

### ledger-ui

| Sprint | Work           | Status  |
| ------ | -------------- | ------- |
| S-XR-2 | XR-510 publish | blocked |

### gtcx-docs (hub)

| Sprint  | Work                          | Status |
| ------- | ----------------------------- | ------ |
| Ongoing | Index only; P22 audit refresh | ready  |

### gtcx-agile

| Sprint   | Work                                  | Status           |
| -------- | ------------------------------------- | ---------------- |
| Parallel | Audit v2 dual-output publish (XR-012) | pending approval |

---

## Human / external tracker (baseline-os items without protocol equivalent)

| ID     | Title                                   | Owner                     | Status                        | Sprint | Unblocks                |
| ------ | --------------------------------------- | ------------------------- | ----------------------------- | ------ | ----------------------- |
| XR-008 | exploration-os re-audit F-33/H-F prod   | audit agent               | blocked on XR-507             | S-XR-1 | Audit narrative         |
| XR-012 | Audit v2 dual-output publish + ingest   | gtcx-docs, agentic, agile | in_progress                   | S-XR-4 | Forensic ingest         |
| XR-016 | Lender webhook owner + Supabase secrets | TBD owner                 | blocked                       | S-XR-2 | F-51 prod notify        |
| XR-018 | Protocol 24 coordination check in CI    | Tier-2 repos              | in_progress                   | S-XR-4 | Hygiene gate            |
| XR-021 | First sovereign ratification ceremony   | sovereign program         | open                          | S-XR-3 | ISO, date, signer DID   |
| XR-022 | Pen-test vendor selection               | Security / gtcx-core      | **done** (SensePost selected) | S-XR-3 | D9 completion           |
| XR-023 | Mobile attestation credentials          | DevOps procurement        | open                          | S-XR-3 | Confirm vs #86 path     |
| XR-024 | Signed design-partner LOI               | Founder / GTM             | open                          | S-XR-5 | External pilot proof    |
| XR-025 | Coordination folder gaps                | repo maintainers          | open                          | S-XR-4 | terra-os, hardware, ops |

---

## Risk register (cross-repo)

| Risk                                       | Likelihood | Impact | Mitigation                                          |
| ------------------------------------------ | ---------- | ------ | --------------------------------------------------- |
| Wrong INF-86 algorithm applied to DID doc  | Medium     | High   | XR-401 sign-off; schema discriminated union shipped |
| Mobile keygen desync from staging DID      | Medium     | Med    | Use SM only; documented in bridge                   |
| Intelligence placeholder SDK left deployed | Medium     | High   | XR-201 acceptance checks full SDK metrics           |
| P25 prod blocked on terra-os adapters      | High       | Med    | Fixture path for S-XR-4; terra inbound ticket       |
| NPM publish credentials missing            | Medium     | Med    | Human escalation for XR-509/510                     |
| Cloudflare zone:write token missing        | Medium     | Med    | Dashboard manual action or new token for XR-507     |
| Supabase project stays paused              | Medium     | Med    | Ops dashboard unpause for XR-508                    |

---

## Reporting

| Action             | Command / location                                                                    |
| ------------------ | ------------------------------------------------------------------------------------- |
| Log update         | Append [`cross-repo-agent-log.md`](cross-repo-agent-log.md)                           |
| Bridge summary     | Edit **Latest updates** in [`cross-repo-agent-bridge.md`](cross-repo-agent-bridge.md) |
| Blocker            | `baseline-os` `pnpm ecosystem:repo:report-work`                                       |
| Work ID completion | Update Status column in this file + log entry                                         |

---

## Changelog

| Date       | Change                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-06-05 | Reconciled post-session: XR-401 done, XR-402 ready, XR-405 done, XR-507 done, XR-508 done, W2-OPS-001 done, INT-D05 done |
| 2026-06-03 | Initial workplan from ecosystem coordination folder review                                                               |
| 2026-06-03 | Reconciled three XR schemes; added baseline-only human/external tracker; added risk register                             |
