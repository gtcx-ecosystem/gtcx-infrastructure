---
title: 'Infra per-repo action matrix (execution view)'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
role: platform-engineer
document_id: INF-PER-REPO-001
parent: cloud-placement-aws-control-plane-2026-06-05.md
---

# Infra per-repo action matrix

**Audience:** gtcx-infrastructure agents only.

**Problem this solves:** The ecosystem register ([`repo-register-2026-06-05.md`](../../../../gtcx-docs/docs/architecture/cloud-placement/repo-register-2026-06-05.md)) describes **every repo’s cloud posture**. This file says **what gtcx-infrastructure must do** for each repo — and what is **not** infra’s job.

**Read order:**

1. **This file** — execution checklist
2. [`cloud-placement-aws-control-plane-2026-06-05.md`](./cloud-placement-aws-control-plane-2026-06-05.md) — scope boundaries
3. [`README.md`](./README.md) — XR sprint IDs (staging E2E, INF-86, etc.)
4. Ecosystem SoR: [`gtcx-docs/.../cloud-placement/README.md`](../../../../gtcx-docs/docs/architecture/cloud-placement/README.md)

---

## One rule

| gtcx-infrastructure                                                  | Other repos                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Hosts** on AWS: EKS, SM→ESO, RDS, S3, WAF, IAM, origins, GHCR pull | **Build & deploy** app images, run smoke, own business logic |
| **Seals** secrets; never commits plaintext                           | **Consumes** secrets via `envFrom` / vault                   |
| **Enables** cluster routes for smoke (INT-S9-01)                     | **Runs** smoke scripts and publishes evidence                |

**You are not** migrating compliance to GCP, training on Vertex, or choosing LLM models.

---

## P0 — Do now (blocks ecosystem)

| Repo               | Infra action                                                                                                                                                                                                                                                                         | Owner repo does                                                                | Inbound / evidence                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **compliance-os**  | **Ask 1:** GHCR `imagePullSecret` for `ghcr.io/gtcx-ecosystem/compliance-web` in `compliance-os-staging`. **Ask 2:** Seal SM→K8s for `compliance-api-secrets`, `caas-secrets`, `core12-secrets`, `via-secrets`, `vxa-secrets`, `minio-secrets`. Optional: approve slim overlay only. | No more `kubectl apply` until infra clears; then intake smoke + hub #17 steps. | [compliance-os inbound](https://github.com/gtcx-ecosystem/compliance-os/blob/main/docs/operations/coordination/to-gtcx-infrastructure-w2-hub-17-staging-blockers-2026-06-05.md) |
| **gtcx-platforms** | **S1-02:** Refresh `01-schema.sql` from platforms TypeORM migrations (S2-07 phase 1 landed).                                                                                                                                                                                         | Own schema/migrations in `platforms/shared`.                                   | platforms → infra coordination                                                                                                                                                  |
| **exploration-os** | **XR-507:** DNS CNAME `verify.explorationos.gtcx.trade` → Pages. **XR-508:** Unpause Supabase project `lolfkclpuvccntgtzwaj` (dashboard — infra may need account access).                                                                                                            | Run migrations + contract smoke after unblock.                                 | [`to-gtcx-infrastructure-verifier-dns-2026-06-03.md`](../../../../exploration-os/docs/operations/coordination/to-gtcx-infrastructure-verifier-dns-2026-06-03.md)                |

---

## P1 — Active hosting (infra deploys; owner builds image)

| Repo                  | Infra action                                                                                                                                                                                          | Owner repo does                                                | Notes                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **gtcx-protocols**    | Staging cluster: Kong, ingress, API keys, WAF rules when asked. **Hold** INF-86 KMS until XR-401 human sign-off.                                                                                      | Schema, probes, `bog.json`, playbook witnesses.                | XR-101 done; XR-103 deferred                                                                                                                      |
| **gtcx-intelligence** | EKS `intelligence` namespace: orchestrator Deployment, `ENABLE_COST_ROUTER` env, staging route for smoke. **Do not** stand up GKE. Phase 3: enable `gcp-ml-bridge` Terraform when GCP SA id provided. | Build/push SDK image; INT-S9-01 smoke; GCP ML in Phase 3 epic. | XR-201 done; bridge epic in `docs/operations/intelligence-phase-3-gcp-ml-bridge-epic-2026-06-05.md`                                               |
| **gtcx-platforms**    | ECR rollout, sovereign/cloud ingress, JWT secrets in SM, WAF `/api/*`.                                                                                                                                | Image build, app config, migration run locally.                | XR-301/302 done                                                                                                                                   |
| **gtcx-mobile**       | SM secret `gtcx/staging/mobile-audit-e2e-credentials` (XR-003 done).                                                                                                                                  | `pnpm staging:pilot-smoke`                                     | XR-102 ready                                                                                                                                      |
| **terminal-os**       | **Planned:** `terminal-os-staging` on EKS + ExternalSecret for `COMPLIANCE_OS_TERMINAL_API_KEY` (D3).                                                                                                 | Stop relying on Vercel for prod path; webhook wiring.          | [`w2-hosting-decision`](https://github.com/gtcx-ecosystem/compliance-os/blob/main/docs/operations/coordination/w2-hosting-decision-2026-06-05.md) |
| **exploration-os**    | W2 M2M bearer in SM if compliance-os inbound asks (XR-502).                                                                                                                                           | Bearer wire, retest against compliance origin.                 | F3: Supabase stays exploration data plane                                                                                                         |
| **gtcx-core**         | EAP bundle / ESO refresh when core inbound lands.                                                                                                                                                     | Packages, fuzz, ceremony prep — no cluster host.               | Adjacent                                                                                                                                          |
| **gtcx-agentic**      | CI vault injection when runners need cluster creds.                                                                                                                                                   | Vault SoR, audit runners.                                      | Adjacent                                                                                                                                          |

---

## P2 — Wait / link only (no infra cluster work)

| Repo                                         | Infra action                | Why                                           |
| -------------------------------------------- | --------------------------- | --------------------------------------------- |
| **baseline-os**                              | None — link blocker index   | Coordination hub, not hosted                  |
| **gtcx-docs**                                | None — maintain SoR links   | Governance docs only                          |
| **gtcx-agile**                               | None                        | Sprint tooling                                |
| **ledger-ui**                                | None until XR-510 npm creds | npm publish is XC, not EKS                    |
| **terra-os**                                 | None until W2 adapter epic  | Live permit adapters — terra owns             |
| **gtcx-markets** / **gtcx-operations**       | None                        | Satellite; AWS when product turns on          |
| **gtcx-hardware**                            | None                        | Device edge — out of cloud matrix             |
| **nyota-ai** / **griot-ai** / **veritas-ai** | None                        | Call intelligence over HTTPS on AWS           |
| **sensei-ai**                                | **Out of band**             | Separate product — not GTCX EKS unless merged |

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
Inbound says gtcx-infrastructure?
├─ Secret / EKS / RDS / S3 / WAF / DNS / GHCR → YES (this repo)
├─ App bug / API logic / LLM prompt / Vertex pipeline → NO (owner repo)
├─ npm publish / Supabase schema / Vercel deploy → NO unless inbound explicitly asks infra platform op
└─ New workload stores compliance PII → AWS only; update gtcx-docs normative matrix first
```

---

## Friction register (infra-owned fixes)

| ID  | Fix                                                 | Repos                                 |
| --- | --------------------------------------------------- | ------------------------------------- |
| F2  | GHCR `imagePullSecret`                              | compliance-os, **infra**              |
| F1  | Terminal EKS + secret mirror                        | terminal-os, compliance-os, **infra** |
| F4  | Canonical staging origins doc                       | exploration, compliance, **infra**    |
| F6  | Rebuild intelligence staging image with cost-router | intelligence builds, **infra** deploy |

Full list: register §7 in gtcx-docs.

---

## After P0 checklist

1. Run compliance-os witness path: `pnpm w2:staging-prereq-check` (from compliance-os repo, cluster creds).
2. Report: `baseline-os` `pnpm ecosystem:repo:report-work --repo=gtcx-infrastructure --item="hub-17 Ask 1+2" --status=completed`.
3. Append [`cross-repo-agent-log.md`](./cross-repo-agent-log.md).

---

_Maintained by gtcx-infrastructure. Update when inbound lands or P0/P1 changes._
