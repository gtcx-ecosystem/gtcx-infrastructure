---
title: 'Cross-repo coordination — gtcx-infrastructure hub index'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
role: platform-engineer
tier: critical
review_cycle: daily
tags: ['coordination', 'cross-repo', 'inbound', 'bridge', 'index']
---

# Cross-repo coordination — gtcx-infrastructure hub index

**Canonical XR-### SoR:** [`gtcx-protocols/docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md`](../../../../gtcx-protocols/docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md)  
**Ecosystem bridge (live):** [`gtcx-protocols/docs/operations/coordination/cross-repo-agent-bridge.md`](../../../../gtcx-protocols/docs/operations/coordination/cross-repo-agent-bridge.md)  
**Agentic log (append-only):** [`gtcx-agentic/docs/operations/coordination/agent-coordination-log.md`](../../../../gtcx-agentic/docs/operations/coordination/agent-coordination-log.md)  
**Blocker SoR:** `baseline-os/workstream/index/blockers.md`

---

## Artifacts in this folder

| Artifact                                                                                                             | Role                                                | Path                                                      |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| **This file**                                                                                                        | Hub index — start here                              | [`README.md`](README.md)                                  |
| [`cross-repo-agent-bridge.md`](cross-repo-agent-bridge.md)                                                           | **Chat-style bridge** — snapshot, broadcasts, rules | `cross-repo-agent-bridge.md`                              |
| [`cross-repo-agent-log.md`](cross-repo-agent-log.md)                                                                 | **Append-only log** — infra-specific entries        | `cross-repo-agent-log.md`                                 |
| [`cross-repo-sprint-workplan-2026-06.md`](cross-repo-sprint-workplan-2026-06.md)                                     | Unified XR-### register + sprint plan               | `cross-repo-sprint-workplan-2026-06.md`                   |
| [`remaining-cross-repo-work-2026-06-03.md`](remaining-cross-repo-work-2026-06-03.md)                                 | Detailed notes on all open cross-repo work          | `remaining-cross-repo-work-2026-06-03.md`                 |
| [`xr-201-intelligence-auth-gate-runbook.md`](xr-201-intelligence-auth-gate-runbook.md)                               | **P0 runbook** — XR-201 step-by-step with findings  | `xr-201-intelligence-auth-gate-runbook.md`                |
| [`from-gtcx-protocols-staging-operator-seed-2026-06-02.md`](from-gtcx-protocols-staging-operator-seed-2026-06-02.md) | Inbound — Track A done handoff                      | `from-gtcx-protocols-staging-operator-seed-2026-06-02.md` |
| [`to-gtcx-intelligence-track-b-auth-2026-06-03.md`](to-gtcx-intelligence-track-b-auth-2026-06-03.md)                 | Outbound — XR-201 auth gate                         | `to-gtcx-intelligence-track-b-auth-2026-06-03.md`         |
| [`to-gtcx-platforms-rollout-ready-2026-06-03.md`](to-gtcx-platforms-rollout-ready-2026-06-03.md)                     | Outbound — XR-301/302 rollout                       | `to-gtcx-platforms-rollout-ready-2026-06-03.md`           |

---

## Quick start for agents

1. **First time here?** Read [`cross-repo-agent-bridge.md`](cross-repo-agent-bridge.md) § Latest updates
2. **Need XR status?** Open [`cross-repo-sprint-workplan-2026-06.md`](cross-repo-sprint-workplan-2026-06.md)
3. **Posting an update?** Append [`cross-repo-agent-log.md`](cross-repo-agent-log.md)
4. **P0 blocker?** Report to `baseline-os` `pnpm ecosystem:repo:report-work --status=blocked`

---

## Sprint S-XR-1 (2026-06-03 → 06-07) — Staging E2E close

| ID     | From              | Title                                          | Status                   | Infra action                                                                                                                | Acceptance                                                              |
| ------ | ----------------- | ---------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| XR-101 | gtcx-protocols    | Staging operator DID + native protocols deploy | **DONE**                 | Deploy `gtcx-protocols:v0.4.6` + `TRADEPASS_SEED=1` + API key secret + ingress switch                                       | `GET /v1/tradepass/did:gtcx:tp_staging_e2e_001` → 200 + OKP/Ed25519 JWK |
| XR-102 | gtcx-mobile       | Mobile audit E2E                               | **READY** (mobile-owned) | SM creds provisioned; IAM read access may need escalation                                                                   | Mobile loads SM → `pnpm staging:pilot-smoke -- --e2e`                   |
| XR-201 | gtcx-intelligence | Intelligence-staging auth gate                 | **BLOCKED**              | Deploy full SDK (not orchestrator placeholder); auth on `/health` → 401/403; EAP key → 200; real `INTELLIGENCE_FAILURE_URL` | Runbook `staging-intelligence-eso-bootstrap.md` green                   |
| XR-003 | gtcx-mobile       | SM vault handoff                               | **DONE**                 | `gtcx/staging/mobile-audit-e2e-credentials` created + updated with matching JWK                                             | Mobile can read `PRIVATE_JWK`, `AUDIT_TOKEN`, `DID`, `KEY_ID`           |

---

## Sprint S-XR-2 (2026-06-08 → 06-14) — Platforms staging + intelligence smoke

| ID     | From              | Title                           | Status                            | Infra action                                                                           | Acceptance                                            |
| ------ | ----------------- | ------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| XR-301 | gtcx-platforms    | Sovereign staging image rollout | **READY**                         | Rollout support when platforms pushes image                                            | `sovereign-staging.gtcx.trade/health` not placeholder |
| XR-302 | gtcx-platforms    | AGX staging image + rollout     | **IN-PROGRESS** (platforms-owned) | Rollout support when image ready                                                       | `api.staging.gtcx.trade/api/health` 200               |
| XR-202 | gtcx-intelligence | INT-S3-08 re-smoke              | **BLOCKED** on XR-201             | Ping intelligence when XR-201 green                                                    | Intelligence commits `deployment-smoke-*.json`        |
| XR-103 | gtcx-protocols    | WAF `/v1/admin/*` 403 fix       | **DEFERRED**                      | Add WAF rule for `/v1/admin/tradepass/register-operator` if external admin curl needed | Admin POST returns JSON 200/403, not HTML 403         |

---

## Sprint S-XR-3 (2026-06-15 → 06-21) — INF-86 pilot gh-bog

| ID     | From                 | Title                                                  | Status                | Infra action                                         | Acceptance                       |
| ------ | -------------------- | ------------------------------------------------------ | --------------------- | ---------------------------------------------------- | -------------------------------- |
| XR-401 | CISO / platform-lead | Algorithm decision (ECC_NIST_P256 vs Ed25519/CloudHSM) | **BLOCKED** (human)   | Await sign-off; document recommendation (Option A)   | Signed decision record           |
| XR-402 | gtcx-protocols       | INF-86 pilot KMS ceremony                              | **HOLD**              | **DO NOT APPLY** until XR-401 + custodians scheduled | Ceremony log + public key export |
| XR-403 | gtcx-protocols       | Update `bog.json` production key                       | **BLOCKED** on XR-402 | Hand off public key; **do not edit `key_status`**    | Protocols PR with evidence       |
| XR-404 | exploration-os       | `contract:gtcx` post-pilot                             | **BLOCKED** on XR-403 | None — exploration-os runs test                      | `npm run contract:gtcx` PASS     |
| XR-405 | gtcx-platforms       | Platforms KMS signing wire-up                          | **BLOCKED** on XR-403 | Wire IAM when protocols schema is ready              | Production authority claims work |

**Hold details:** See `docs/security/key-ceremony-runbook.md` §5.4

- Single pilot authority only (`gh-bog`)
- Max 10 authorities per batch post-pilot
- Total 5 batches for 43 authorities

---

## Sprint S-XR-4 (2026-06-08 → 06-28 parallel) — P25 W2 + exploration blockers

| ID     | From           | Title                                | Status                        | Infra action                                                            | Acceptance                                                      |
| ------ | -------------- | ------------------------------------ | ----------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| XR-507 | exploration-os | SIR verifier prod deploy             | **BLOCKED** on DNS            | Cloudflare Pages deployed; need CNAME `verify.explorationos.gtcx.trade` | `https://verify.explorationos.gtcx.trade/sir` live + smoke PASS |
| XR-508 | exploration-os | Supabase prod migrations (006 + 007) | **BLOCKED** on paused project | Unpause `lolfkclpuvccntgtzwaj` → `supabase db push`                     | `financing_applications` table + RLS + trigger active           |
| XR-502 | compliance-os  | W2 M2M intake secret                 | **READY**                     | Provide infra secret for compliance-os M2M bearer if needed             | Secret in vault/SM                                              |

**Verifier status:** Deployed to `https://4d98ac1c.exploration-os-verifier.pages.dev/sir` with pepper injected. Custom domain pending zone:write permission.

**Supabase status:** Project `lolfkclpuvccntgtzwaj` is **paused**. Needs dashboard unpause before migrations can apply.

---

## Sprint S-XR-5 (2026-06-08 → 06-28 parallel) — P22 agent ergonomics

| ID     | From          | Title                        | Status    | Infra action                                               | Acceptance |
| ------ | ------------- | ---------------------------- | --------- | ---------------------------------------------------------- | ---------- |
| XR-516 | gtcx-docs hub | P22 W4 core — infrastructure | **READY** | Add `agent:next-work` CI smoke when sprint capacity allows | CI passes  |

---

## Deferred / post-pilot

| ID     | From           | Title                    | Trigger                          |
| ------ | -------------- | ------------------------ | -------------------------------- |
| XR-518 | gtcx-protocols | Expand 43 authorities    | After XR-402 pilot success       |
| XR-509 | gtcx-protocols | `@gtcx/mcp` npm publish  | NPM credentials resolved         |
| XR-510 | ledger-ui      | `@gtcx/ui@0.4.1` publish | NPM_TOKEN resolved               |
| XR-506 | terra-os       | Live permit adapters     | P22 W4 core + external diligence |

---

## Closed (do not re-open)

| ID                    | Date       | Evidence                                              |
| --------------------- | ---------- | ----------------------------------------------------- |
| XR-060                | 2026-06-02 | Protocols #60 authority DID staging verified          |
| XR-050                | 2026-06-02 | Infra #50–#52 audit presence live                     |
| XR-101                | 2026-06-03 | `GET /v1/tradepass/did:gtcx:tp_staging_e2e_001` → 200 |
| Track A operator seed | 2026-06-03 | Native protocols `v0.4.6` deployed                    |

---

## Dependency graph

```
S-XR-1 (this week):
  XR-101 [done] → XR-102 [mobile ready]
  XR-201 [blocked] → XR-202 [intelligence blocked]

S-XR-2 (next week):
  XR-301/302 [platforms ready] → infra rollout
  XR-201 [if unblocked] → XR-202 [intelligence re-smoke]

S-XR-3 (week of 06-15):
  XR-401 [human] → XR-402 [infra hold] → XR-403 [protocols] → XR-404/405

S-XR-4 (parallel):
  XR-507 [DNS] + XR-508 [unpause] — both blocked on external actions
```

---

## Cross-repo XR-ID mapping

Some sibling bridges use an early numbering scheme. Map to canonical protocols registry:

| Agentic / Other | Canonical (protocols) | Title                                   |
| --------------- | --------------------- | --------------------------------------- |
| XR-001          | XR-101                | Staging operator DID + native protocols |
| XR-002          | XR-201                | Intelligence auth gate                  |
| XR-003          | XR-102                | Mobile audit E2E                        |
| XR-004          | XR-301                | Sovereign signed-edge staging           |
| XR-005          | XR-302                | AGX staging `/api/*`                    |
| XR-006          | XR-507                | SIR verifier prod URL                   |
| XR-007          | XR-202                | Intelligence full-stack re-smoke        |
| XR-009          | XR-402                | INF-86 authority key pilot              |
| XR-010          | XR-502                | W2 compliance M2M intake                |
| XR-011          | XR-503                | W2 review webhook                       |
| XR-014          | XR-506                | TerraOS live permit adapters            |
| XR-015          | XR-501                | exploration-os validators 0.5.0         |
| XR-017          | XR-511–516            | P22 CI rollout                          |
| XR-019          | XR-517                | SPEC §17 sign-off                       |

---

## Communication rules

| Do                                                                    | Don't                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------- |
| Append to **agent log** when status changes                           | Edit another repo's coordination doc without PR      |
| Update this file `XR-*` status when completing a slice                | Copy full bridge into Slack — link this file         |
| Report P0 blockers to `baseline-os` `pnpm ecosystem:repo:report-work` | Claim Track A still blocked (marked done 2026-06-03) |
| Use protocols sprint workplan for canonical XR registry               | Create duplicate XR-IDs                              |

---

## Per-repo coordination docs (reviewed 2026-06-03)

| Repo                  | Coordination path               | Infra depends?                           |
| --------------------- | ------------------------------- | ---------------------------------------- |
| **gtcx-protocols**    | `docs/operations/coordination/` | **Yes** — DID schema, authority registry |
| **gtcx-mobile**       | `docs/operations/coordination/` | Adjacent — SM consumer                   |
| **gtcx-intelligence** | `docs/operations/coordination/` | **Yes** — Track B deploy target          |
| **gtcx-platforms**    | `docs/operations/coordination/` | **Yes** — ECR rollout inbound            |
| **exploration-os**    | `docs/operations/coordination/` | **Yes** — verifier + Supabase            |
| **gtcx-agentic**      | `docs/operations/coordination/` | Adjacent — vault runners                 |
| **compliance-os**     | `docs/operations/coordination/` | Adjacent — W2 secret                     |
| **gtcx-core**         | `docs/operations/coordination/` | Adjacent — EAP bundle sync               |
| **baseline-os**       | `workstream/coordination/`      | Hub blockers                             |
| **terra-os**          | **Missing**                     | Live permit adapters (W2)                |
| **gtcx-hardware**     | **Missing**                     | PRD-001 device cohort                    |
| **gtcx-operations**   | **Missing**                     | Ops runbooks                             |

---

## Reporting

```bash
# Report infra work to coordination hub
cd /path/to/baseline-os
pnpm ecosystem:repo:report-work \
  --repo=gtcx-infrastructure \
  --item="<description>" \
  --status=<pending|in-progress|blocked|completed|deferred>
```

---

_Last updated: 2026-06-03_  
_Refresh when XR status changes or new inbound lands._
