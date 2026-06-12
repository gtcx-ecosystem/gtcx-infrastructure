---
title: 'Infra per-repo action matrix (execution view)'
status: current
date: 2026-06-12
owner: fabric-os
role: platform-engineer
document_id: INF-PER-REPO-001
parent: cloud-placement-aws-control-plane-2026-06-05.md
initiative: INIT-FABRIC-LANE-DEPLOY-MATRIX
laneRegistry: pm/spec/trade-ecosystem-lanes.json
---

# Infra per-repo action matrix

**Audience:** fabric-os agents only.

**Problem this solves:** The ecosystem register ([`repo-register-2026-06-05.md`](../../../../canon-os/01-docs/architecture/cloud-placement/repo-register-2026-06-05.md)) describes **every repo’s cloud posture**. This file says **what fabric-os must do** for each repo — and what is **not** infra’s job.

**Read order:**

1. **This file** — execution checklist
2. [`cloud-placement-aws-control-plane-2026-06-05.md`](./cloud-placement-aws-control-plane-2026-06-05.md) — scope boundaries
3. [`README.md`](./README.md) — XR sprint IDs (staging E2E, INF-86, etc.)
4. Ecosystem SoR: [`canon-os/.../cloud-placement/README.md`](../../../../canon-os/01-docs/architecture/cloud-placement/README.md)

---

## One rule

| fabric-os                                                            | Other repos                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Hosts** on AWS: EKS, SM→ESO, RDS, S3, WAF, IAM, origins, GHCR pull | **Build & deploy** app images, run smoke, own business logic |
| **Seals** secrets; never commits plaintext                           | **Consumes** secrets via `envFrom` / vault                   |
| **Enables** cluster routes for smoke (INT-S9-01)                     | **Runs** smoke scripts and publishes evidence                |

**You are not** migrating compliance to GCP, training on Vertex, or choosing LLM models.

---

## P0 — Complete (2026-06-05)

All infra P0 items verified. **Next:** owner-repo smoke (compliance hub #17 intake, exploration F-33, platforms consumers).

| Lane            | Repo               | Infra delivered                                                                                                                               | Owner repo next                                                        | Evidence                                                                                                                                                                                                                                               |
| --------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **L3**          | **compliance-os**  | **DONE:** GHCR pull + 6 non-W2 secrets — K8s manifests, Terraform, SM bootstrap (`populate-compliance-os-staging-sm.sh`), ESO path documented | `kubectl apply` / `pnpm w2:staging-prereq-check`; hub #17 intake smoke | [`staging-compliance-os-eso-bootstrap.md`](../staging-compliance-os-eso-bootstrap.md) · [hub #17 inbound](https://github.com/gtcx-ecosystem/compliance-os/blob/main/01-docs/04-ops/coordination/to-fabric-os-w2-hub-17-staging-blockers-2026-06-05.md) |
| **C** (L4a/L4b) | **gtcx-platforms** | **DONE:** S1-02 schema refresh phase 2 (21 tables)                                                                                            | Consumers use refreshed `01-schema.sql`                                | platforms S2-07 coordination                                                                                                                                                                                                                           |
| **L1**          | **exploration-os** | **DONE:** XR-507 verifier DNS + Pages custom domain (smoke 200, pepper). XR-508 Supabase active (`financing_applications` queryable)          | Contract smoke + F-33 audit close                                      | [`remaining-cross-repo-work-2026-06-03.md`](./remaining-cross-repo-work-2026-06-03.md) § XR-507/508                                                                                                                                                    |

---

## P1 — Active hosting (infra deploys; owner builds image)

| Lane     | Repo                             | Infra action                                                                                                                                                                                          | Owner repo does                                                | Notes                                                                                                                                            |
| -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **T0**   | **gtcx-protocols**               | Staging cluster: Kong, ingress, API keys, WAF rules when asked. **Hold** INF-86 KMS until XR-401 human sign-off.                                                                                      | Schema, probes, `bog.json`, playbook witnesses.                | XR-101 done; XR-103 deferred                                                                                                                     |
| **L2**   | **gtcx-intelligence**            | EKS `intelligence` namespace: orchestrator Deployment, `ENABLE_COST_ROUTER` env, staging route for smoke. **Do not** stand up GKE. Phase 3: enable `gcp-ml-bridge` Terraform when GCP SA id provided. | Build/push SDK image; INT-S9-01 smoke; GCP ML in Phase 3 epic. | XR-201 done; bridge epic in `01-docs/04-ops/intelligence-phase-3-gcp-ml-bridge-epic-2026-06-05.md`                                               |
| **C**    | **gtcx-platforms**               | ECR rollout, sovereign/cloud ingress, JWT secrets in SM, WAF `/api/*`.                                                                                                                                | Image build, app config, migration run locally.                | XR-301/302 done — Sovereign **L4a** + Cloud AGX **L4b**                                                                                          |
| **L1**   | **gtcx-mobile**                  | SM secret `gtcx/staging/mobile-audit-e2e-credentials` (XR-003 done).                                                                                                                                  | `pnpm staging:pilot-smoke`                                     | XR-102 ready                                                                                                                                     |
| **L2**   | **terminal-os**                  | **In progress:** `terminal-os-staging` on EKS + ExternalSecret for `COMPLIANCE_OS_TERMINAL_API_KEY` (D3). Manifests committed (`f0f18a1`). Pending: SM populate + apply + smoke.                      | Stop relying on Vercel for prod path; webhook wiring.          | [`w2-hosting-decision`](https://github.com/gtcx-ecosystem/compliance-os/blob/main/01-docs/04-ops/coordination/w2-hosting-decision-2026-06-05.md) |
| **L1**   | **exploration-os**               | W2 M2M bearer in SM if compliance-os inbound asks (XR-502).                                                                                                                                           | Bearer wire, retest against compliance origin.                 | F3: Supabase stays exploration data plane                                                                                                        |
| **T0.5** | **gtcx-core**                    | EAP bundle / ESO refresh when core inbound lands.                                                                                                                                                     | Packages, fuzz, ceremony prep — no cluster host.               | Adjacent                                                                                                                                         |
| **B**    | **bridge-os** (was gtcx-agentic) | CI vault injection when runners need cluster creds.                                                                                                                                                   | Vault SoR, audit runners.                                      | Program office — not infra (**I**)                                                                                                               |

---

## P2 — Wait / link only (no infra cluster work)

| Lane    | Repo                          | Infra action                | Why                                           |
| ------- | ----------------------------- | --------------------------- | --------------------------------------------- |
| **A**   | **baseline-os**               | None — link blocker index   | AI OS — vault SoR; not infra (**I**)          |
| **U**   | **canon-os** (was gtcx-docs)  | None — maintain SoR links   | Governance utility — not trade core           |
| **U**   | **agile-os** (was gtcx-agile) | None                        | Fleet sprint utility                          |
| **X**   | **ledger-ui**                 | None until XR-510 npm creds | Desk shell — never T0 protocols               |
| **L1**  | **terra-os**                  | None until W2 adapter epic  | Site verification sibling                     |
| **L4a** | **gtcx-operations**           | None                        | Sovereign Operations module in **C**          |
| **L4b** | **markets-os**                | **P41 DaaS** — XR-MKT-011   | S39-01 authority routes, AGX ingress, auth SM |
| **L1**  | **gtcx-hardware**             | None                        | Device edge — out of cloud matrix             |
| **L2**  | **nyota-ai** / **griot-ai**   | None                        | Market intelligence siblings                  |
| **L3**  | **veritas-ai**                | None                        | Attestation sibling — distinct from CRX       |
| **L4a** | **sensei-os** (was sensei-ai) | **Out of band**             | Civic lane — sovereign product sibling        |

---

## Cloud placement by repo (infra lens)

| Repo              | Primary cloud                        | Infra touches GCP?                                   |
| ----------------- | ------------------------------------ | ---------------------------------------------------- |
| compliance-os     | **AWS** EKS                          | **No**                                               |
| gtcx-intelligence | **AWS** runtime; **GCP** ML Phase 3+ | **Yes** — `gcp-ml-bridge` module only when P3 starts |
| gtcx-platforms    | **AWS**                              | **No**                                               |
| gtcx-protocols    | **AWS** staging                      | **No**                                               |
| terminal-os       | **Vercel → AWS** (target EKS)        | **No**                                               |
| exploration-os    | **Supabase** + AWS SM for M2M        | **No** (do not move Supabase to RDS without epic)    |
| gtcx-mobile       | **AWS** SM                           | **No**                                               |

---

## “Am I needed?” (30 seconds)

```
Inbound says fabric-os?
├─ Secret / EKS / RDS / S3 / WAF / DNS / GHCR → YES (this repo)
├─ App bug / API logic / LLM prompt / Vertex pipeline → NO (owner repo)
├─ npm publish / Supabase schema / Vercel deploy → NO unless inbound explicitly asks infra platform op
└─ New workload stores compliance PII → AWS only; update gtcx-docs normative matrix first
```

---

## Staging ingress (DaaS-S2 publish)

| Lane    | Host                          | Service          | Namespace             | Card                                                      |
| ------- | ----------------------------- | ---------------- | --------------------- | --------------------------------------------------------- |
| **L4b** | `api.staging.gtcx.trade`      | gtcx-agx-staging | gtcx-staging          | [markets-os DaaS card](../daas/cards/markets-os.md)       |
| **L2**  | `terminal-staging.gtcx.trade` | terminal-os      | terminal-os-staging   | [terminal-os DaaS card](../daas/cards/terminal-os.md)     |
| **L3**  | compliance-os staging         | multi-workload   | compliance-os-staging | [compliance-os DaaS card](../daas/cards/compliance-os.md) |

## Friction register (infra-owned fixes)

| ID  | Fix                                                 | Repos                                 |
| --- | --------------------------------------------------- | ------------------------------------- |
| F2  | GHCR `imagePullSecret`                              | compliance-os, **infra**              |
| F1  | Terminal EKS + secret mirror                        | terminal-os, compliance-os, **infra** |
| F4  | Canonical staging origins doc                       | exploration, compliance, **infra**    |
| F6  | Rebuild intelligence staging image with cost-router | intelligence builds, **infra** deploy |

Full list: register §7 in gtcx-docs.

---

## Post-P0 handoffs (owner repos)

| Repo           | Action                                                               |
| -------------- | -------------------------------------------------------------------- |
| compliance-os  | Run `pnpm w2:staging-prereq-check`; hub #17 steps 2–5 when web Ready |
| exploration-os | F-33 / `contract:gtcx` smoke against live verifier + Supabase        |
| gtcx-agentic   | ~~XR-008 verifier re-audit~~ **done** 2026-06-05                     |
| exploration-os | ~~XR-EO-003 lender webhook~~ **done** 2026-06-05 — hub #15 cleared   |

Report infra platform work: `baseline-os` `pnpm ecosystem:repo:report-work --repo=fabric-os --item="<slice>" --status=completed`.

---

_Maintained by fabric-os. Update when inbound lands or P0/P1 changes._
