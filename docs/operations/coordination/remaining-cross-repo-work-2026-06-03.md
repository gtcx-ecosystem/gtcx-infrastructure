---
title: 'Remaining cross-repo work — gtcx-infrastructure'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
from: gtcx-infrastructure
to: baseline-os coordination hub + sibling repos
---

# Remaining cross-repo work (gtcx-infrastructure)

> **Bridge (read first):** [`cross-repo-agent-bridge.md`](cross-repo-agent-bridge.md)  
> **Sprint plan:** [`cross-repo-sprint-workplan-2026-06.md`](cross-repo-sprint-workplan-2026-06.md)  
> **Activity log:** [`cross-repo-agent-log.md`](cross-repo-agent-log.md)  
> **Ecosystem review:** see `gtcx-mobile/.../ecosystem-coordination-review-2026-06-03.md`

---

## Summary

| Category                                    | Open | P0 this week | Infra action required             |
| ------------------------------------------- | ---: | :----------- | --------------------------------- |
| Staging Track A (operator DID + SM)         |    0 | No           | **DONE** — monitor only           |
| Staging Track B (intelligence auth)         |    1 | **Yes**      | Deploy full SDK + auth gate       |
| Platforms staging (sovereign + AGX)         |    2 | No           | Rollout when image pushed         |
| Exploration blockers (verifier + Supabase)  |    2 | No           | External actions (CF admin + ops) |
| INF-86 sovereign pilot                      |    2 | No           | **HOLD** — human-gated            |
| W2 licence intelligence                     |    1 | No           | Provide secrets if asked          |
| P22 agent ergonomics                        |    1 | No           | Add CI smoke when capacity        |
| Coordination gaps (terra-os, hardware, ops) |    1 | No           | Flagged to baseline-os            |

---

## P0 — S-XR-1 (this week)

### XR-201 — Intelligence-staging auth gate (INT-S3-08) — **DEPLOYED 2026-06-03**

| Field        | Value                                              |
| ------------ | -------------------------------------------------- |
| **Status**   | **DONE** — full SDK deployed, auth enforced        |
| **Owner**    | **gtcx-infrastructure**                            |
| **Image**    | `gtcx-intelligence-sdk:12be5342`                   |
| **Unblocks** | XR-202 (intelligence re-smoke); INT-S3-08 evidence |

**Deployment evidence:**

| Endpoint          | No auth | With key | Note                              |
| ----------------- | ------- | -------- | --------------------------------- |
| `/health`         | 200     | 200      | Exempt by design (ALB/K8s probes) |
| `/live`           | 200     | 200      | Exempt by design (K8s liveness)   |
| `/ready`          | 200     | 200      | Exempt by design (K8s readiness)  |
| `/metrics`        | 200     | 200      | Exempt by design (Prometheus)     |
| `/policy/rules`   | 401     | 200      | Auth enforced ✅                  |
| `/feedback/stats` | 401     | 200      | Auth enforced ✅                  |

**What was done:**

1. ✅ Created Deployment + Service manifest in `infra/kubernetes/overlays/staging/intelligence/deployment.yaml`
2. ✅ Updated kustomization to include deployment
3. ✅ Resolved FIPS issue (`NODE_ENV=staging`; image lacks FIPS module)
4. ✅ Deployed full SDK image from ECR
5. ✅ Verified auth enforcement on non-exempt paths

**Caveat:** `/health` returns 200 without auth — this is by design in the SDK (`AUTH_EXEMPT_PATHS` includes `/health`, `/live`, `/ready`, `/metrics`). The ALB health check and K8s probes require this. The acceptance criteria in protocols kickoff may need updating.

**Next:** Ping intelligence for XR-202 re-smoke — see [`to-gtcx-intelligence-track-b-auth-2026-06-03.md`](to-gtcx-intelligence-track-b-auth-2026-06-03.md)

---

## P1 — S-XR-2 (next week)

### XR-301 / XR-302 — Platforms sovereign + AGX staging rollout

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| **Status**     | **ready** (XR-301) / **in-progress** (XR-302, platforms-owned) |
| **Owner**      | gtcx-platforms (push) → **gtcx-infrastructure** (rollout)      |
| **Blocked by** | Platforms must push image digest to ECR                        |
| **Unblocks**   | P4-07 smoke; api.staging `/api/*` health                       |

**What infra needs from platforms:**

1. ECR image digest for `gtcx-sovereign:staging`
2. ECR image digest for `gtcx-agx:staging`
3. Notification via log entry or bridge ping

**What infra will do:**

1. Update `overlays/staging/kustomization.yaml` with new digests
2. `kubectl apply -k overlays/staging`
3. Verify endpoints
4. Post evidence in log

**Sibling docs:**

- Infra outbound: [`to-gtcx-platforms-rollout-ready-2026-06-03.md`](to-gtcx-platforms-rollout-ready-2026-06-03.md)
- Platforms bridge: `gtcx-platforms/docs/operations/coordination/cross-repo-agent-bridge.md`
- Platforms staging live: `gtcx-platforms/docs/operations/coordination/staging-live-2026-06-02.md`

---

## P1 — S-XR-4 (parallel)

### XR-507 — SIR verifier prod deploy

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **Status**     | **blocked** — DNS not configured                                            |
| **Owner**      | **gtcx-infrastructure**                                                     |
| **Blocked by** | Cloudflare OAuth token lacks `zone:write`; cannot create DNS record via API |
| **Unblocks**   | F-33 audit close; XR-008 re-audit                                           |

**Current state:**

- Pages deployed to `https://4d98ac1c.exploration-os-verifier.pages.dev/sir`
- Pepper injected; verifier functional
- Custom domain `verify.explorationos.gtcx.trade` needs CNAME

**Options to unblock:**

1. **Preferred:** Obtain CF token with `zone:write` → automate DNS via Terraform
2. **Fallback:** Manual dashboard action by CF admin
3. **Defer:** Use Pages random subdomain for staging (not prod)

**Sibling docs:**

- exploration-os outbound: `exploration-os/docs/operations/coordination/to-gtcx-infrastructure-outbound-2026-06-02.md`
- gtcx-agentic audit runbook: `gtcx-agentic/audit/AGENT-START.md`

---

### XR-508 — Supabase prod migrations

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| **Status**     | **blocked** — project paused                                   |
| **Owner**      | **gtcx-infrastructure** / ops                                  |
| **Blocked by** | Project `lolfkclpuvccntgtzwaj` is paused in Supabase dashboard |
| **Unblocks**   | Financing prod path; `financing_applications` table            |

**Current state:**

- Migrations `006_financing_applications.sql` + `007_financing_lender_webhook.sql` are ready
- `supabase link` and `supabase db push` fail with project paused error
- Must be unpaused from Supabase dashboard before any migration can run

**Action:** Escalate to ops/whoever has Supabase dashboard access to unpause project.

**Sibling docs:**

- exploration-os outbound: `exploration-os/docs/operations/coordination/to-gtcx-infrastructure-outbound-2026-06-02.md`

---

## HOLD — S-XR-3

### XR-401 / XR-402 — INF-86 pilot ceremony

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| **Status**     | **HOLD** — DO NOT APPLY                                                      |
| **Owner**      | CISO + platform-lead (XR-401) → **gtcx-infrastructure** (XR-402)             |
| **Blocked by** | Algorithm decision (ECC_NIST_P256 vs Ed25519/CloudHSM); custodian scheduling |
| **Unblocks**   | XR-403 (protocols bog.json); production authority keys                       |

**Hold guardrails:**

- Single pilot authority only (`gh-bog`)
- Max 10 authorities per batch post-pilot
- Total 5 batches for 43 authorities
- See `docs/security/key-ceremony-runbook.md` §5.4

**What infra should NOT do:**

- Do NOT apply Terraform for KMS sovereign signing module yet
- Do NOT schedule ceremony until XR-401 sign-off
- Do NOT rotate any production keys

**What infra should prepare:**

- Review `infra/terraform/modules/kms-sovereign-signing/` readiness
- Ensure IAM roles for ceremony exist
- Document SPKI export procedure

**Sibling docs:**

- Key ceremony runbook: `docs/security/key-ceremony-runbook.md`
- Protocols runbook: `gtcx-protocols/docs/operations/coordination/inf-86-pilot-gh-bog-protocols-runbook-2026-06-02.md`

---

## P1 — Parallel / ready

### XR-502 — W2 M2M intake secret (compliance-os)

| Field        | Value                                                                |
| ------------ | -------------------------------------------------------------------- |
| **Status**   | **ready** — no action unless compliance-os asks                      |
| **Owner**    | compliance-os (consumer) → **gtcx-infrastructure** (secret provider) |
| **Action**   | Seal `COMPLIANCE_OS_INTAKE_API_KEY` in staging overlay if requested  |
| **Unblocks** | ExplorationOS export to compliance-os                                |

**Note:** compliance-os may already have this wired. Infra action only if they file inbound ticket.

---

## P2 — Parallel / deferred

### XR-103 — WAF `/v1/admin/*` 403 fix

| Field        | Value                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Status**   | **deferred**                                                                                                         |
| **Owner**    | **gtcx-infrastructure**                                                                                              |
| **Context**  | `POST /v1/admin/tradepass/register-operator` returns HTML 403 from upstream (WAF/Cloudflare). Pod would return JSON. |
| **Action**   | Add WAF rule to allow admin paths with proper auth headers if external admin curl needed                             |
| **Priority** | Low — admin registration can run via port-forward or internal network                                                |

---

### XR-516 — P22 W4 core CI smoke

| Field       | Value                                                                        |
| ----------- | ---------------------------------------------------------------------------- |
| **Status**  | **ready** — waiting capacity                                                 |
| **Owner**   | **gtcx-infrastructure**                                                      |
| **Action**  | Add `agent:next-work` to GitHub Actions workflow when sprint capacity allows |
| **Pattern** | Copy gtcx-protocols CI pattern                                               |

---

### XR-025 — Coordination folder gaps (tracked in baseline-os)

| Repo            | Has coordination folder? | Action                                                |
| --------------- | ------------------------ | ----------------------------------------------------- |
| terra-os        | **No**                   | Flag to terra-os maintainer; blocks W2-E01 visibility |
| gtcx-hardware   | **No**                   | Flag to hardware lead; blocks PRD-001 visibility      |
| gtcx-operations | **No**                   | Flag to ops lead; blocks runbook sharing              |

**Note:** This is baseline-os XR-025. Infrastructure does not own creating these folders but should remind sibling repos during sprint check-ins.

---

## Closed (do not re-open)

| ID      | Date       | Evidence                                              | Why closed                 |
| ------- | ---------- | ----------------------------------------------------- | -------------------------- |
| XR-060  | 2026-06-02 | Authority DID staging verified                        | No further action          |
| XR-050  | 2026-06-02 | Infra #50–#52 audit presence live                     | Evidence posted            |
| XR-101  | 2026-06-03 | `GET /v1/tradepass/did:gtcx:tp_staging_e2e_001` → 200 | Acceptance met             |
| Track A | 2026-06-03 | Native protocols v0.4.6 deployed                      | Ingress switched to native |

---

## Communication protocol

When status changes on any item above:

1. Append [`cross-repo-agent-log.md`](cross-repo-agent-log.md)
2. Update [`cross-repo-agent-bridge.md`](cross-repo-agent-bridge.md) § Latest updates
3. Update [`cross-repo-sprint-workplan-2026-06.md`](cross-repo-sprint-workplan-2026-06.md) Status column
4. If P0, report to baseline-os: `pnpm ecosystem:repo:report-work --repo=gtcx-infrastructure --item="<XR-ID> <note>" --status=<status>`

---

_Last updated: 2026-06-03_  
_Next review: daily or on any P0 status change._
