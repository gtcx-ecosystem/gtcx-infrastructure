---
title: 'Cross-repo agent bridge — gtcx-infrastructure'
status: current
date: 2026-06-06
owner: gtcx-infrastructure
role: platform-engineer
tier: critical
tags: ['coordination', 'bridge', 'agents', 'protocol-24']
review_cycle: daily
protocol: gtcx-docs/01-docs/governance/protocols/24-cross-repo-coordination/protocol.md
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
[`gtcx-protocols/01-docs/04-ops/coordination/cross-repo-agent-bridge.md`](../../../../gtcx-protocols/01-docs/04-ops/coordination/cross-repo-agent-bridge.md)

**Agentic log (append-only):**  
[gtcx-agentic agent-coordination-log](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/coordination/agent-coordination-log.md)

**Blocker SoR:** `baseline-os/workstream/index/blockers.md`

---

## How agents use this bridge

1. **Session start:** Read **Latest updates** below → [`cross-repo-agent-log.md`](cross-repo-agent-log.md) last 10 rows → check your XR-### in sprint workplan.
2. **Cross-repo change:** Append one row to **agent log**; if P0, also `baseline-os` `pnpm ecosystem:repo:report-work --status=blocked`.
3. **Ecosystem-wide P0:** Read protocols bridge **Critical path** before duplicating 04-ship/protocols work.
4. **Do not** paste secrets, JWK private keys, or `AUDIT_TOKEN` values here.

---

## Latest updates (newest first)

| When (UTC) | Agent / repo        | Update                                                                                                                                                                                                                                                                                                   |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-07 | gtcx-infrastructure | **EXT-INF-002 pack ack** — gtcx-core FA-S6-02 vendor pack (22 artifacts) receipt acknowledged; attach to SOW. SOW signature Class S still open (S2-13). [`outbound/from-gtcx-infrastructure-ext-inf-002-pack-ack-2026-06-07.md`](./outbound/from-gtcx-infrastructure-ext-inf-002-pack-ack-2026-06-07.md) |
| 2026-06-06 | gtcx-infrastructure | **Protocol 26 ACK — baseline-os Sprint 5 done:** Vault DR (S5-01), HPA autoscaling (S5-02), on-call rotation (S5-03) complete. Baseline-os repo-completable queue drained. No new blockers from infra.                                                                                                   |
| 2026-06-06 | gtcx-infrastructure | **APPROVAL / UNBLOCK response:** Class S AWS SM/ESO terminal-os staging key — **ALREADY RESOLVED** (commit `3a794fa`, 44-byte aligned, health 200). Infra-side approval granted. External LOI remains human-gated.                                                                                       |
| 2026-06-05 | gtcx-infrastructure | **W2-E2E UNBLOCKED:** `COMPLIANCE_OS_TERMINAL_API_KEY` aligned terminal-os ↔ compliance-os-w2-secrets. AWS SM updated, ESO sync verified, deployment restarted. Root cause: 44-byte key drift. Infrastructure scope complete.                                                                            |
| 2026-06-05 | gtcx-infrastructure | **XR-507 DONE:** Verifier DNS live — `verify.explorationos.gtcx.trade/sir` 200 + pepper. Cloudflare Pages custom domain confirmed. F-33 audit unblocked.                                                                                                                                                 |
| 2026-06-05 | gtcx-infrastructure | **XR-508 DONE:** Supabase project unpaused; `financing_applications` REST 200; migrations 006/007 applied. Financing prod path unblocked.                                                                                                                                                                |
| 2026-06-05 | gtcx-infrastructure | **XR-401 UNBLOCKED:** CISO algorithm sign-off received (ECC_NIST_P256 / ECDSA_SHA_256). XR-402 INF-86 pilot ceremony now ready for scheduling.                                                                                                                                                           |
| 2026-06-05 | gtcx-infrastructure | **XR-405 DONE:** Platforms KMS sovereign signing wire-up complete. Staging IRSA role added to production KMS key policy. Sovereign staging can call `kms:Sign` for integration testing.                                                                                                                  |
| 2026-06-05 | gtcx-infrastructure | **INT-R2-03 ROLLED OUT:** `kubectl apply` executed; deployment rolled out; pod env `ENABLE_COST_ROUTER=1` confirmed; `/health` probe returns `features.enableCostRouter: true`. INT-S8-01 unblocked.                                                                                                     |
| 2026-06-04 | gtcx-infrastructure | **W2-OPS-001 DONE:** terminal-os staging deployed on EKS. AMD64 image built on EC2, pushed to ECR. ALB ingress + ACM cert + Cloudflare DNS live. `https://terminal-staging.gtcx.trade/api/health` → 200.                                                                                                 |
| 2026-06-04 | gtcx-infrastructure | **INT-D05 DONE:** Staging EKS scaled 2→3 nodes (t3.medium). Litmus chaos operator installed in `litmus` namespace. Cluster capacity and chaos engineering readiness unblocked.                                                                                                                           |
| 2026-06-04 | gtcx-infrastructure | **INT-R2-03 DONE:** `ENABLE_COST_ROUTER=1` added to intelligence-orchestrator staging Deployment. Unblocks INT-S8-01 for gtcx-intelligence. Precedent: compliance-gateway BASELINE_COST_ROUTER=1.                                                                                                        |
| 2026-06-04 | gtcx-infrastructure | **ER-1-08 DONE:** Infra acknowledges EAP Phase B closure. `normalizeStatus()` fix is agentic-only; no infra code changes. No blockers.                                                                                                                                                                   |
| 2026-06-03 | gtcx-infrastructure | **XR-104 DONE:** compliance-gateway DID resolve fixed. SDK rebuilt (audit-tradepass-auth-amd64), signing secret fixed (valid PKCS#8 DER Ed25519), rollout verified. Mobile E2E unblocked.                                                                                                                |
| 2026-06-03 | gtcx-infrastructure | **XR-201 finding:** `intelligence-orchestrator` Deployment manifest is **missing** from infra repo. ESO/ingress/secrets all live. Need gtcx-intelligence to provide full SDK image + manifest. See runbook.                                                                                              |
| 2026-06-03 | gtcx-infrastructure | **XR-104 DONE:** compliance-gateway audit-tradepass-auth-amd64 deployed; signing init OK; DID resolver verified. Unblocks MOBILE-AUDIT-01.                                                                                                                                                               |
| 2026-06-03 | gtcx-infrastructure | **XR-202 READY:** Outbound handoff created for intelligence re-smoke. Full env spec + caveats in `outbound-handoff-xr-202-to-intelligence.md`.                                                                                                                                                           |
| 2026-06-03 | gtcx-infrastructure | **XR-201 DONE:** Full intelligence SDK `12be5342` deployed to staging. Auth enforced on non-exempt paths. `/health` 200 by design (ALB health check); `/policy/rules` 401→200 with key.                                                                                                                  |
| 2026-06-03 | gtcx-infrastructure | Coordination hub expanded: bridge + sprint workplan + outbound handoffs created. XR schemes reconciled (protocols canonical).                                                                                                                                                                            |
| 2026-06-03 | gtcx-platforms      | XR-301/302: ECR rollout outbound to infra; `main` 8 commits ahead of origin (push before CI ECR workflow). Sovereign external `/health` → 526 (edge).                                                                                                                                                    |
| 2026-06-03 | gtcx-protocols      | **S-XR-1 begun:** `probe-staging-cross-repo.mjs` — api/authority/operator OK; intelligence `/health` still **200** (XR-201 **not met**). Operator GET requires Bearer.                                                                                                                                   |
| 2026-06-03 | gtcx-infrastructure | Track A complete per `from-gtcx-protocols-staging-operator-seed` (DONE). SM `gtcx/staging/mobile-audit-e2e-credentials` aligned.                                                                                                                                                                         |
| 2026-06-03 | gtcx-protocols      | INF-86 pre-ceremony: `AuthorityVerificationMethodSchema` supports Ed25519 + P-256 (`577b79e5`). Post-ceremony tooling ready.                                                                                                                                                                             |
| 2026-06-03 | gtcx-intelligence   | **XR-202 done** — INT-S3-08 closed; witness `cross-repo-closure-2026-06-03.md`.                                                                                                                                                                                                                          |
| 2026-06-02 | gtcx-infrastructure | #50–#52 audit presence live; evidence posted on GitHub.                                                                                                                                                                                                                                                  |

> Full history: [`cross-repo-agent-log.md`](cross-repo-agent-log.md)

---

## Current snapshot (2026-06-03)

| Track                       | XR-ID  | Status                   | Owner                  | Unblocks           | Risk   |
| --------------------------- | ------ | ------------------------ | ---------------------- | ------------------ | ------ |
| Operator DID / mobile audit | XR-101 | **done**                 | gtcx-infrastructure    | Mobile E2E         | —      |
| Mobile staging audit E2E    | XR-102 | **done**                 | gtcx-mobile            | MOBILE-AUDIT-01/02 | —      |
| compliance-gateway Bearer   | XR-104 | **done**                 | gtcx-infrastructure    | XR-102             | R-high |
| Intelligence auth gate      | XR-201 | **done**                 | gtcx-infrastructure    | XR-202 / INT-S3-08 | R-high |
| Intelligence re-smoke       | XR-202 | **done**                 | gtcx-intelligence      | Protocols mirror   | —      |
| Protocols smoke mirror      | XR-203 | **done**                 | gtcx-protocols         | —                  | —      |
| Sovereign staging image     | XR-301 | **done**                 | gtcx-platforms → infra | P4-07 smoke        | R-med  |
| AGX staging `/api/*`        | XR-302 | **done**                 | gtcx-platforms → infra | Mobile API path    | R-med  |
| INF-86 algorithm            | XR-401 | **done** (CISO sign-off) | CISO + platform-lead   | XR-402–405         | R-high |
| INF-86 pilot ceremony       | XR-402 | **ready**                | gtcx-infrastructure    | XR-403             | R-high |
| SIR verifier prod           | XR-507 | **done** (2026-06-05)    | gtcx-infrastructure    | F-33 audit close   | R-med  |
| Supabase migrations         | XR-508 | **done** (2026-06-05)    | gtcx-infrastructure    | Financing prod     | R-med  |

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

| Priority  | ID     | Owner                         | Next action                                                      | Infra unblocks when                                   |
| --------- | ------ | ----------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| **P0**    | XR-202 | gtcx-intelligence             | **done** 2026-06-03 — evidence committed                         | —                                                     |
| **P1**    | XR-301 | gtcx-platforms → **infra**    | **done** 2026-06-03 — sovereign staging deployed + healthy       | `sovereign-staging.gtcx.trade/health` not placeholder |
| **P1**    | XR-302 | gtcx-platforms → **infra**    | **done** 2026-06-03 — AGX staging deployed + all blockers closed | `api.staging.gtcx.trade/api/health` 200               |
| **P1**    | XR-507 | **gtcx-infrastructure**       | **done** 2026-06-05 — DNS + Pages custom domain live             | F-33 audit close                                      |
| **P1**    | XR-508 | **gtcx-infrastructure** / ops | **done** 2026-06-05 — Project unpaused; migrations applied       | Financing prod                                        |
| **P2**    | XR-103 | **gtcx-infrastructure**       | WAF rule for `/v1/admin/tradepass/register-operator` if needed   | Admin POST returns JSON                               |
| **DONE**  | XR-401 | CISO + platform-lead          | Algorithm decision — **ECC_NIST_P256 / ECDSA_SHA_256**           | XR-402 unblocked                                      |
| **READY** | XR-402 | **gtcx-infrastructure**       | Pilot KMS ceremony `gh-bog` — UNBLOCKED for engineering          | Ceremony evidence + SPKI                              |

---

## Ecosystem snapshot (infra-relevant only)

| Theme                               | Status                      | Infra action                                  |
| ----------------------------------- | --------------------------- | --------------------------------------------- |
| Staging Track A (operator DID + SM) | **Done**                    | Monitor only                                  |
| Staging Track B (intelligence auth) | **Done**                    | Monitor only; SDK `12be5342` deployed         |
| Platforms sovereign + AGX           | **Open**                    | Rollout when image ready                      |
| SIR verifier prod                   | **Done** (2026-06-05)       | Monitor only                                  |
| Supabase prod migrations            | **Done** (2026-06-05)       | Monitor only                                  |
| INF-86 / #61                        | **Unblocked** (XR-401 done) | Ready for ceremony scheduling + SPKI export   |
| W2 licence intelligence             | **Parallel**                | Provide secrets if compliance-os asks         |
| P22 agent ergonomics                | **Parallel**                | Add `agent:next-work` CI when capacity allows |

---

## Per-repo coordination paths (reviewed 2026-06-03)

See [`cross-repo-sprint-workplan-2026-06.md`](cross-repo-sprint-workplan-2026-06.md) for full register.

| Repo              | Has `01-docs/.../coordination/`? | Infra depends?                           |
| ----------------- | -------------------------------- | ---------------------------------------- |
| gtcx-protocols    | Yes (ecosystem hub)              | **Yes** — DID schema, authority registry |
| gtcx-mobile       | Yes                              | Adjacent — SM consumer                   |
| gtcx-intelligence | Yes                              | **Yes** — Track B deploy target          |
| gtcx-platforms    | Yes                              | **Yes** — ECR rollout inbound            |
| exploration-os    | Yes                              | **Yes** — verifier + Supabase            |
| gtcx-agentic      | Yes                              | Adjacent — vault runners                 |
| compliance-os     | Yes                              | Adjacent — W2 secret                     |
| gtcx-core         | Yes                              | Adjacent — EAP bundle sync               |
| baseline-os       | `workstream/coordination/`       | Hub blockers                             |
| terra-os          | **Missing**                      | Live permit adapters (W2)                |
| gtcx-hardware     | **Missing**                      | PRD-001 device cohort                    |
| gtcx-operations   | **Missing**                      | Ops runbooks                             |

---

## Priority broadcasts (copy to sibling agents)

### gtcx-infrastructure

- **XR-201/202 DONE** — full SDK deployed; intelligence vault smoke evidence committed.
- **XR-104 DONE** — compliance-gateway DID resolve fixed. SDK rebuilt (audit-tradepass-auth-amd64), signing secret fixed (valid PKCS#8 DER Ed25519), rollout verified. Mobile E2E unblocked.
- **INF-86 pilot** — UNBLOCKED. XR-401 CISO sign-off received (ECC_NIST_P256). XR-402 ready for ceremony execution.

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
- Key ceremony runbook: `01-docs/09-security/key-ceremony-runbook.md`
- Protocols sprint workplan: `gtcx-protocols/01-docs/04-ops/coordination/cross-repo-sprint-workplan-2026-06.md`

---

_Last bridge review: 2026-06-06. Trigger: any P0 status change or sprint boundary._

---

## Staging health snapshot (2026-06-03)

| Deployment                 | Namespace           | Status | Note                                                |
| -------------------------- | ------------------- | ------ | --------------------------------------------------- |
| compliance-gateway-staging | gtcx-staging        | ✅ 1/1 | XR-104 resolved                                     |
| did-resolver-staging       | gtcx-staging        | ✅ 1/1 | DID docs serving                                    |
| gtcx-protocols-staging     | gtcx-staging        | ✅ 1/1 | v0.4.6                                              |
| redis-staging              | gtcx-staging        | ✅ 1/1 | —                                                   |
| sovereign-staging          | gtcx-staging        | ✅ 1/1 | XR-405 KMS signing enabled                          |
| gtcx-agx-staging           | gtcx-staging        | ✅ 1/1 | XR-302 resolved — platform-shared fixed             |
| intelligence-orchestrator  | intelligence        | ✅ 2/2 | XR-201 done; cost router enabled                    |
| terminal-os-staging        | terminal-os-staging | ✅ 1/1 | W2-OPS-001 done; `terminal-staging.gtcx.trade` live |

**Platforms action needed:** AGX image `v0.4.0` is missing `@gtcx/platform-shared` dependency. Blocks XR-302 (`/api/*`).
