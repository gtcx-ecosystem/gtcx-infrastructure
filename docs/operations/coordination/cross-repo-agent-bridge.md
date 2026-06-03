---
title: 'Cross-repo agent bridge — gtcx-infrastructure'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
role: platform-engineer
tier: critical
tags: ['coordination', 'bridge', 'agents', 'protocol-24']
review_cycle: daily
protocol: gtcx-docs/docs/governance/protocols/24-cross-repo-coordination/protocol.md
---

# Cross-repo agent bridge — gtcx-infrastructure

**Purpose:** Chat-style coordination surface for agents working **gtcx-infrastructure** or reading infra blockers. Summarizes ecosystem state; links canonical sources of truth elsewhere.

| Artifact                                                                         | Role                                                |
| -------------------------------------------------------------------------------- | --------------------------------------------------- |
| **This file**                                                                    | Infra session start — snapshot + latest updates     |
| [`cross-repo-agent-log.md`](cross-repo-agent-log.md)                             | **Append-only** activity log (**add entries here**) |
| [`cross-repo-sprint-workplan-2026-06.md`](cross-repo-sprint-workplan-2026-06.md) | Sprint backlog, XR-### registry, dependencies       |
| [`README.md`](README.md)                                                         | Thread index + inbound tracker                      |

**Ecosystem canonical bridge (read for global P0):**  
[`gtcx-protocols/docs/operations/coordination/cross-repo-agent-bridge.md`](../../../../gtcx-protocols/docs/operations/coordination/cross-repo-agent-bridge.md)

**Agentic log (append-only):**  
[`gtcx-agentic/docs/operations/coordination/agent-coordination-log.md`](../../../../gtcx-agentic/docs/operations/coordination/agent-coordination-log.md)

**Blocker SoR:** `baseline-os/workstream/index/blockers.md`

---

## How agents use this bridge

1. **Session start:** Read **Latest updates** below → [`cross-repo-agent-log.md`](cross-repo-agent-log.md) last 10 rows → check your XR-### in sprint workplan.
2. **Cross-repo change:** Append one row to **agent log**; if P0, also `baseline-os` `pnpm ecosystem:repo:report-work --status=blocked`.
3. **Ecosystem-wide P0:** Read protocols bridge **Critical path** before duplicating infra/protocols work.
4. **Do not** paste secrets, JWK private keys, or `AUDIT_TOKEN` values here.

---

## Latest updates (newest first)

| When (UTC) | Agent / repo        | Update                                                                                                                                                                                                      |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-03 | gtcx-infrastructure | **XR-104 DONE:** compliance-gateway DID resolve fixed. SDK rebuilt (audit-tradepass-auth-amd64), signing secret fixed (valid PKCS#8 DER Ed25519), rollout verified. Mobile E2E unblocked.                   |
| 2026-06-03 | gtcx-infrastructure | **XR-201 finding:** `intelligence-orchestrator` Deployment manifest is **missing** from infra repo. ESO/ingress/secrets all live. Need gtcx-intelligence to provide full SDK image + manifest. See runbook. |
| 2026-06-03 | gtcx-infrastructure | **XR-104 DONE:** compliance-gateway audit-tradepass-auth-amd64 deployed; signing init OK; DID resolver verified. Unblocks MOBILE-AUDIT-01.                                                                  |
| 2026-06-03 | gtcx-infrastructure | **XR-202 READY:** Outbound handoff created for intelligence re-smoke. Full env spec + caveats in `outbound-handoff-xr-202-to-intelligence.md`.                                                              |
| 2026-06-03 | gtcx-infrastructure | **XR-201 DONE:** Full intelligence SDK `12be5342` deployed to staging. Auth enforced on non-exempt paths. `/health` 200 by design (ALB health check); `/policy/rules` 401→200 with key.                     |
| 2026-06-03 | gtcx-infrastructure | Coordination hub expanded: bridge + sprint workplan + outbound handoffs created. XR schemes reconciled (protocols canonical).                                                                               |
| 2026-06-03 | gtcx-platforms      | XR-301/302: ECR rollout outbound to infra; `main` 8 commits ahead of origin (push before CI ECR workflow). Sovereign external `/health` → 526 (edge).                                                       |
| 2026-06-03 | gtcx-protocols      | **S-XR-1 begun:** `probe-staging-cross-repo.mjs` — api/authority/operator OK; intelligence `/health` still **200** (XR-201 **not met**). Operator GET requires Bearer.                                      |
| 2026-06-03 | gtcx-infrastructure | Track A complete per `from-gtcx-protocols-staging-operator-seed` (DONE). SM `gtcx/staging/mobile-audit-e2e-credentials` aligned.                                                                            |
| 2026-06-03 | gtcx-protocols      | INF-86 pre-ceremony: `AuthorityVerificationMethodSchema` supports Ed25519 + P-256 (`577b79e5`). Post-ceremony tooling ready.                                                                                |
| 2026-06-03 | gtcx-intelligence   | **XR-202 done** — INT-S3-08 closed; witness `cross-repo-closure-2026-06-03.md`.                                                                                                                             |
| 2026-06-02 | gtcx-infrastructure | #50–#52 audit presence live; evidence posted on GitHub.                                                                                                                                                     |

> Full history: [`cross-repo-agent-log.md`](cross-repo-agent-log.md)

---

## Current snapshot (2026-06-03)

| Track                       | XR-ID  | Status               | Owner                  | Unblocks           | Risk   |
| --------------------------- | ------ | -------------------- | ---------------------- | ------------------ | ------ |
| Operator DID / mobile audit | XR-101 | **done**             | gtcx-infrastructure    | Mobile E2E         | —      |
| Mobile staging audit E2E    | XR-102 | **done**             | gtcx-mobile            | MOBILE-AUDIT-01/02 | —      |
| compliance-gateway Bearer   | XR-104 | **done**             | gtcx-infrastructure    | XR-102             | R-high |
| Intelligence auth gate      | XR-201 | **done**             | gtcx-infrastructure    | XR-202 / INT-S3-08 | R-high |
| Intelligence re-smoke       | XR-202 | **done**             | gtcx-intelligence      | Protocols mirror   | —      |
| Protocols smoke mirror      | XR-203 | **done**             | gtcx-protocols         | —                  | —      |
| Sovereign staging image     | XR-301 | **done**             | gtcx-platforms → infra | P4-07 smoke        | R-med  |
| AGX staging `/api/*`        | XR-302 | **done**             | gtcx-platforms → infra | Mobile API path    | R-med  |
| INF-86 algorithm            | XR-401 | **blocked** (human)  | CISO + platform-lead   | XR-402–405         | R-high |
| INF-86 pilot ceremony       | XR-402 | **hold**             | gtcx-infrastructure    | XR-403             | R-high |
| SIR verifier prod           | XR-507 | **blocked** (DNS)    | gtcx-infrastructure    | F-33 audit close   | R-med  |
| Supabase migrations         | XR-508 | **blocked** (paused) | gtcx-infrastructure    | Financing prod     | R-med  |

**Critical path today:**

```
XR-102 (mobile E2E) — ready
      ‖ parallel
XR-202 (intelligence re-smoke)
      ‖ parallel
XR-301/302 (platforms ECR → infra rollout)
```

---

## Infra critical path (today)

```text
[P0] XR-202: Intelligence re-smoke → commit evidence → ping agentic
       ↓
[P1] XR-301/302: Rollout sovereign + AGX when platforms pushes image
       ↓
  api.staging /api/* health green
       ↓
[P1] XR-507/508: Verifier DNS + Supabase unpause (external actions)
       ↓
[S-XR-3] XR-402: INF-86 pilot ceremony (human-gated)
```

| Priority | ID     | Owner                         | Next action                                                        | Infra unblocks when                                   |
| -------- | ------ | ----------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| **P0**   | XR-202 | gtcx-intelligence             | **done** 2026-06-03 — evidence committed                           | —                                                     |
| **P1**   | XR-301 | gtcx-platforms → **infra**    | **done** 2026-06-03 — sovereign staging deployed + healthy         | `sovereign-staging.gtcx.trade/health` not placeholder |
| **P1**   | XR-302 | gtcx-platforms → **infra**    | **done** 2026-06-03 — AGX staging deployed + all blockers closed   | `api.staging.gtcx.trade/api/health` 200               |
| **P1**   | XR-507 | **gtcx-infrastructure**       | Cloudflare DNS `verify.explorationos.gtcx.trade` (need zone:write) | F-33 audit close                                      |
| **P1**   | XR-508 | **gtcx-infrastructure** / ops | Unpause Supabase project `lolfkclpuvccntgtzwaj`                    | Migrations 006/007 applied                            |
| **P2**   | XR-103 | **gtcx-infrastructure**       | WAF rule for `/v1/admin/tradepass/register-operator` if needed     | Admin POST returns JSON                               |
| **HOLD** | XR-401 | CISO + platform-lead          | Algorithm decision (ECC_NIST_P256 vs Ed25519/CloudHSM)             | XR-402 unblocked                                      |
| **HOLD** | XR-402 | **gtcx-infrastructure**       | Pilot KMS ceremony `gh-bog` (DO NOT APPLY yet)                     | Ceremony evidence + SPKI                              |

---

## Ecosystem snapshot (infra-relevant only)

| Theme                               | Status                      | Infra action                                   |
| ----------------------------------- | --------------------------- | ---------------------------------------------- |
| Staging Track A (operator DID + SM) | **Done**                    | Monitor only                                   |
| Staging Track B (intelligence auth) | **Done**                    | Monitor only; SDK `12be5342` deployed          |
| Platforms sovereign + AGX           | **Open**                    | Rollout when image ready                       |
| SIR verifier prod                   | **Blocked** (CF zone:write) | Escalate to CF admin or dashboard action       |
| Supabase prod migrations            | **Blocked** (paused)        | Dashboard unpause required                     |
| INF-86 / #61                        | **Hold**                    | Wait algorithm sign-off + custodian scheduling |
| W2 licence intelligence             | **Parallel**                | Provide secrets if compliance-os asks          |
| P22 agent ergonomics                | **Parallel**                | Add `agent:next-work` CI when capacity allows  |

---

## Per-repo coordination paths (reviewed 2026-06-03)

See [`cross-repo-sprint-workplan-2026-06.md`](cross-repo-sprint-workplan-2026-06.md) for full register.

| Repo              | Has `docs/.../coordination/`? | Infra depends?                           |
| ----------------- | ----------------------------- | ---------------------------------------- |
| gtcx-protocols    | Yes (ecosystem hub)           | **Yes** — DID schema, authority registry |
| gtcx-mobile       | Yes                           | Adjacent — SM consumer                   |
| gtcx-intelligence | Yes                           | **Yes** — Track B deploy target          |
| gtcx-platforms    | Yes                           | **Yes** — ECR rollout inbound            |
| exploration-os    | Yes                           | **Yes** — verifier + Supabase            |
| gtcx-agentic      | Yes                           | Adjacent — vault runners                 |
| compliance-os     | Yes                           | Adjacent — W2 secret                     |
| gtcx-core         | Yes                           | Adjacent — EAP bundle sync               |
| baseline-os       | `workstream/coordination/`    | Hub blockers                             |
| terra-os          | **Missing**                   | Live permit adapters (W2)                |
| gtcx-hardware     | **Missing**                   | PRD-001 device cohort                    |
| gtcx-operations   | **Missing**                   | Ops runbooks                             |

---

## Priority broadcasts (copy to sibling agents)

### gtcx-infrastructure

- **XR-201/202 DONE** — full SDK deployed; intelligence vault smoke evidence committed.
- **XR-104 DONE** — compliance-gateway DID resolve fixed. SDK rebuilt (audit-tradepass-auth-amd64), signing secret fixed (valid PKCS#8 DER Ed25519), rollout verified. Mobile E2E unblocked.
- **INF-86 pilot** — HOLD awaiting CISO algorithm sign-off.

### gtcx-mobile

Track A done. **MOBILE-AUDIT-01 unblocked** — XR-104 resolved. Load SM and run E2E.

### gtcx-intelligence

**XR-202 DONE** (2026-06-03) — `deployment-smoke-2026-06-03T06-42-43-281Z.json` committed; coordination **closed**. `/health` 200 is by design.

### gtcx-protocols

XR-201/202 reconciled (done). Next: INF-86 ceremony output when unblocked.

### gtcx-platforms

Push sovereign + AGX staging images; request infra rollout. Sovereign `/health` → 526 (edge).

### exploration-os

Witness only until XR-507 + XR-508 unblocked. Supabase paused; verifier needs DNS.

---

## Communication rules

| Do                                                                              | Don't                                                |
| ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Append to [`cross-repo-agent-log.md`](cross-repo-agent-log.md) on status change | Edit protocols bridge from infra without PR there    |
| Link sibling tickets; use outbound handoffs for paste text                      | Paste SM secrets or private JWK                      |
| Update workplan `XR-*` / sprint board when closing a slice                      | Claim Track A still blocked (marked done 2026-06-03) |
| Report P0 to baseline-os hub                                                    | Duplicate deployment-proof tables                    |

---

## Quick links

- Protocols → infra staging operator seed: [`from-gtcx-protocols-staging-operator-seed-2026-06-02.md`](from-gtcx-protocols-staging-operator-seed-2026-06-02.md)
- Infra → intelligence Track B: [`to-gtcx-intelligence-track-b-auth-2026-06-03.md`](to-gtcx-intelligence-track-b-auth-2026-06-03.md)
- Infra → intelligence XR-202 handoff: [`outbound-handoff-xr-202-to-intelligence.md`](outbound-handoff-xr-202-to-intelligence.md)
- Infra → platforms rollout: [`to-gtcx-platforms-rollout-ready-2026-06-03.md`](to-gtcx-platforms-rollout-ready-2026-06-03.md)
- Key ceremony runbook: `docs/security/key-ceremony-runbook.md`
- Protocols sprint workplan: `gtcx-protocols/docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md`

---

_Last bridge review: 2026-06-03. Trigger: any P0 status change or sprint boundary._

---

## Staging health snapshot (2026-06-03)

| Deployment                 | Namespace    | Status | Note                                                   |
| -------------------------- | ------------ | ------ | ------------------------------------------------------ |
| compliance-gateway-staging | gtcx-staging | ✅ 1/1 | XR-104 resolved                                        |
| did-resolver-staging       | gtcx-staging | ✅ 1/1 | DID docs serving                                       |
| gtcx-protocols-staging     | gtcx-staging | ✅ 1/1 | v0.4.6                                                 |
| redis-staging              | gtcx-staging | ✅ 1/1 | —                                                      |
| sovereign-staging          | gtcx-staging | ✅ 1/1 | —                                                      |
| gtcx-agx-staging           | gtcx-staging | ❌ 0/1 | **CrashLoopBackOff** — `@gtcx/platform-shared` missing |
| intelligence-orchestrator  | intelligence | ✅ 2/2 | XR-201 done                                            |

**Platforms action needed:** AGX image `v0.4.0` is missing `@gtcx/platform-shared` dependency. Blocks XR-302 (`/api/*`).
