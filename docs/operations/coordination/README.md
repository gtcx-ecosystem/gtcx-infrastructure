---
title: 'Cross-repo coordination — gtcx-infrastructure inbound tracker + bridge'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
role: platform-engineer
tier: critical
review_cycle: daily
tags: ['coordination', 'cross-repo', 'inbound', 'bridge']
---

# Cross-repo coordination — gtcx-infrastructure inbound tracker + bridge

**Canonical XR-### SoR:** [`gtcx-protocols/docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md`](../../../../gtcx-protocols/docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md)  
**Ecosystem bridge (live):** [`gtcx-protocols/docs/operations/coordination/cross-repo-agent-bridge.md`](../../../../gtcx-protocols/docs/operations/coordination/cross-repo-agent-bridge.md)  
**Agentic log (append-only):** [`gtcx-agentic/docs/operations/coordination/agent-coordination-log.md`](../../../../gtcx-agentic/docs/operations/coordination/agent-coordination-log.md)  
**Blocker SoR:** `baseline-os/workstream/index/blockers.md`

| Artifact                                             | Role                                        |
| ---------------------------------------------------- | ------------------------------------------- |
| **This file**                                        | Infra inbound tracker + bridge snapshot     |
| [`cross-repo-agent-log.md`](cross-repo-agent-log.md) | Infra-specific append-only activity log     |
| Protocols sprint workplan                            | Canonical XR-### registry (source of truth) |

---

## Latest updates (newest first)

| When (UTC) | Agent / repo        | Update                                                                                                                                                                 |
| ---------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-03 | gtcx-platforms      | XR-301/302: ECR rollout outbound to infra; `main` 8 commits ahead of origin (push before CI ECR workflow). Sovereign external `/health` → 526 (edge).                  |
| 2026-06-03 | gtcx-protocols      | **S-XR-1 begun:** `probe-staging-cross-repo.mjs` — api/authority/operator OK; intelligence `/health` still **200** (XR-201 **not met**). Operator GET requires Bearer. |
| 2026-06-03 | gtcx-infrastructure | Track A complete per `from-gtcx-protocols-staging-operator-seed` (DONE). SM `gtcx/staging/mobile-audit-e2e-credentials` aligned.                                       |
| 2026-06-03 | gtcx-protocols      | INF-86 pre-ceremony: `AuthorityVerificationMethodSchema` supports Ed25519 + P-256 (`577b79e5`). Post-ceremony tooling ready.                                           |

> Full ecosystem log: [`gtcx-agentic/docs/operations/coordination/agent-coordination-log.md`](../../../../gtcx-agentic/docs/operations/coordination/agent-coordination-log.md)

---

## Current snapshot (2026-06-03)

| Track                       | XR-ID  | Status                | Owner                  | Unblocks           | Risk   |
| --------------------------- | ------ | --------------------- | ---------------------- | ------------------ | ------ |
| Operator DID / mobile audit | XR-101 | **done**              | gtcx-infrastructure    | Mobile E2E         | —      |
| Mobile staging audit E2E    | XR-102 | **ready**             | gtcx-mobile            | MOBILE-AUDIT-01/02 | R-high |
| Intelligence auth gate      | XR-201 | **blocked**           | gtcx-infrastructure    | XR-202 / INT-S3-08 | R-high |
| Intelligence re-smoke       | XR-202 | **blocked** on XR-201 | gtcx-intelligence      | Protocols mirror   | R-high |
| Sovereign staging image     | XR-301 | **ready**             | gtcx-platforms → infra | P4-07 smoke        | R-med  |
| AGX staging `/api/*`        | XR-302 | **in-progress**       | gtcx-platforms → infra | Mobile API path    | R-med  |
| INF-86 algorithm            | XR-401 | **blocked** (human)   | CISO + platform-lead   | XR-402–405         | R-high |
| INF-86 pilot ceremony       | XR-402 | **hold**              | gtcx-infrastructure    | XR-403             | R-high |
| SIR verifier prod           | XR-507 | **blocked** (DNS)     | gtcx-infrastructure    | F-33 audit close   | R-med  |
| Supabase migrations         | XR-508 | **blocked** (paused)  | gtcx-infrastructure    | Financing prod     | R-med  |

**Critical path today:**

```
XR-201 (infra Track B) → XR-202 (intelligence re-smoke)
      ‖ parallel
XR-102 (mobile SM → E2E)
      ‖ parallel
XR-301/302 (platforms ECR → infra rollout)
```

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
| XR-515 | gtcx-docs hub | P22 W4 core — infrastructure | **READY** | Add `agent:next-work` CI smoke when sprint capacity allows | CI passes  |

---

## Deferred / post-pilot

| ID     | From           | Title                    | Trigger                          |
| ------ | -------------- | ------------------------ | -------------------------------- |
| XR-517 | gtcx-protocols | Expand 43 authorities    | After XR-402 pilot success       |
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
| XR-008          | —                     | exploration-os audit F-33/H-F           |
| XR-009          | XR-402                | INF-86 authority key pilot              |
| XR-010          | XR-502                | W2 compliance M2M intake                |
| XR-011          | XR-515                | P22 CI rollout                          |
| XR-012          | —                     | Audit v2 dual-output publish            |

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
| **baseline-os**       | `workstream/coordination/`      | Hub blockers                             |

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
