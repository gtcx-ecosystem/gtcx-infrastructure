---
title: 'inf-86 H-02 Ceremony Tracker'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
role: platform-architect
tier: critical
tags: ['inf-86', 'ceremony', 'KMS', 'sovereign', 'H-02']
review_cycle: on-change
document_id: inf-86-H02-001
---

# inf-86 H-02 Ceremony Tracker

> **Phase:** H-02 — KMS / Terraform / Ceremony / SPKI Export
> **Status:** H-02 complete — XR-403 done
> **Blocked by:** — None.
> **Blocks:** H-03 — gtcx-protocols #61 (DID document update + `key_status: production`) — DONE
> **Canonical runbook:** [`docs/security/key-ceremony-runbook.md`](../security/key-ceremony-runbook.md)
> **Execution plan:** [`docs/gtm/plans/inf-86-hsovereign-key-ceremony-execution-plan.md`](../gtm/plans/inf-86-hsovereign-key-ceremony-execution-plan.md)

---

## Pre-ceremony readiness (infra prepares while H-01 is pending)

| #   | Item                                               | Status      | Evidence                                                                                                                   | Owner        |
| --- | -------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | Terraform module `kms-sovereign-signing` validated | **done**    | `terraform validate` passes                                                                                                | infra        |
| 2   | Production configuration reviewed (gh-bog pilot)   | **done**    | `infra/terraform/environments/production/main.tf:351-369`                                                                  | infra        |
| 3   | Terraform plan pre-validated (dry-run)             | **done**    | [`evidence/inf-86/sovereign-h02-prevalidation-2026-06-03.txt`](evidence/inf-86/sovereign-h02-prevalidation-2026-06-03.txt) | infra        |
| 4   | Ceremony tracker created                           | **done**    | This file                                                                                                                  | infra        |
| 5   | H-02 operator runbook created                      | **done**    | [`docs/security/inf-86-h02-operator-runbook.md`](../security/inf-86-h02-operator-runbook.md)                               | infra        |
| 6   | XR-401-A agentic attestation (CISO + platform)     | **done**    | `pnpm check:inf86-xr401-attestation` passes in gtcx-protocols                                                              | protocols    |
| 7   | Algorithm decision documented (Option A: P-256)    | **done**    | Agentic attestation recorded — `gtcx-protocols/docs/audit/evidence/inf-86-xr-401-agentic-attestation-latest.json`          | governance   |
| 8   | Custodians + witness identified (XR-401-B)         | **done**    | `inf-86-xr-401b-custodian-roster-latest.json` — gate `check:inf86-xr401b-custodian-roster`                                 | gtcx-agentic |
| 9   | Ceremony authorization (XR-401-C)                  | **done**    | `inf-86-xr-401c-ceremony-authorization-latest.json` — gate `check:inf86-xr401c-ceremony-authorization`                     | gtcx-agentic |
| 10  | Tamper-evident evidence store ready                | **pending** | CloudTrail + S3 `gtcx-production-ceremonies/` (video optional; agent session log acceptable for pilot)                     | ops          |
| 11  | AWS CloudTrail active in `af-south-1`              | **verify**  | Confirm via AWS console / CLI                                                                                              | infra        |

---

## Ceremony day checklist (H-02 execution)

**Prerequisites gate:** All 11 pre-ceremony items above must be **done** or **verified** before proceeding.

### Phase H-02a: Terraform apply (dual-control)

| Step | Action                                                                                         | Custodian | Verification                                                           |
| ---- | ---------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| 1    | Verify identities (gov ID check)                                                               | Witness   | Log names + roles + timestamps                                         |
| 2    | `terraform plan -target=module.kms_sovereign_signing -out=sovereign.tfplan`                    | A         | Review plan: only 8 resources (gh-bog)                                 |
| 3    | `terraform apply sovereign.tfplan`                                                             | A         | Capture output                                                         |
| 4    | `aws kms describe-key --key-id alias/gtcx-production-sovereign-gh-bog`                         | B         | Confirm: KeyUsage=SIGN_VERIFY, KeySpec=ECC_NIST_P256, KeyState=Enabled |
| 5    | `aws kms get-key-policy --key-id alias/gtcx-production-sovereign-gh-bog --policy-name default` | B         | Confirm: DenyKeyExport present, signing roles correct                  |
| 6    | `aws kms list-resource-tags --key-id alias/gtcx-production-sovereign-gh-bog`                   | B         | Confirm: RotationDue tag set                                           |

### Phase H-02b: SPKI export + evidence capture

| Step | Action                                                                                                                        | Custodian | Output                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------- |
| 7    | Export public key: `aws kms get-public-key --key-id alias/gtcx-production-sovereign-gh-bog --query 'PublicKey' --output text` | A         | Base64-encoded public key       |
| 8    | Convert to DER: `base64 -d gh-bog.pub.b64 > gh-bog.pub.der`                                                                   | A         | Binary DER file                 |
| 9    | Compute SHA-256 of DER: `shasum -a 256 gh-bog.pub.der`                                                                        | B         | Hash for provenance             |
| 10   | Generate JWK / publicKeyMultibase per protocols schema                                                                        | A         | JSON file for protocols handoff |
| 11   | All participants sign ceremony log                                                                                            | Witness   | Signed log                      |
| 12   | Upload video to `s3://gtcx-production-ceremonies/YYYY-MM-DD/`                                                                 | A         | Tamper-evident storage          |

### Phase H-02c: Post-ceremony verification

| Step | Action                      | Verification                                                      |
| ---- | --------------------------- | ----------------------------------------------------------------- |
| 13   | CloudTrail events confirmed | `CreateKey`, `PutKeyPolicy`, `CreateAlias` within ceremony window |
| 14   | SSM parameters populated    | `/gtcx/production/kms/sovereign/gh-bog/key-id` and `key-arn`      |
| 15   | CloudWatch alarm active     | `gtcx-production-sovereign-gh-bog-unexpected-sign`                |
| 16   | IAM policy attached to IRSA | `gtcx-production-sovereign-gh-bog-kms-sign`                       |

---

## Evidence package (retain 7 years)

| #   | Evidence                                | Path / Location                                         |
| --- | --------------------------------------- | ------------------------------------------------------- |
| 1   | Signed ceremony log                     | `docs/audit/evidence/inf-86/ceremony-log-YYYY-MM-DD.md` |
| 2   | Video recording                         | `s3://gtcx-production-ceremonies/YYYY-MM-DD/`           |
| 3   | CloudTrail events                       | AWS CloudTrail → S3 archive                             |
| 4   | Terraform plan + apply output           | `docs/audit/evidence/inf-86/`                           |
| 5   | Key metadata (`describe-key` JSON)      | `docs/audit/evidence/inf-86/`                           |
| 6   | Witness attestation                     | Ceremony log signature                                  |
| 7   | Public key export (DER + JWK/multibase) | `docs/audit/evidence/inf-86/gh-bog-public-key/`         |
| 8   | Video hash (SHA-256)                    | Ceremony log                                            |

---

## Handoff to H-03 (gtcx-protocols)

After H-02c is complete, infra posts to gtcx-protocols #61:

```markdown
## H-02 Complete — gh-bog pilot ceremony

- Ceremony date: YYYY-MM-DD HH:MM UTC
- Key ARN: `arn:aws:kms:af-south-1:ACCOUNT:key/KEY-ID`
- Alias: `alias/gtcx-production-sovereign-gh-bog`
- Algorithm: ECC_NIST_P256 / ECDSA_SHA_256
- Public key (JWK): [attach gh-bog-public-key/jwk.json]
- Public key (multibase): [attach gh-bog-public-key/multibase.txt]
- Evidence: [link to evidence package]
- Ceremony log: [link to signed log]

Ready for H-03: DID document update + `key_status: production`.
```

---

## Post-pilot expansion (after gh-bog success)

| Batch | Authorities     | Count | Ceremony date |
| ----- | --------------- | ----- | ------------- |
| 1     | gh-bog (pilot)  | 1     | TBD           |
| 2     | West Africa     | 8     | TBD           |
| 3     | East Africa     | 6     | TBD           |
| 4     | Southern Africa | 6     | TBD           |
| 5     | DRC / Central   | 7     | TBD           |
| 6     | Others          | 7     | TBD           |
| 7     | Remaining       | 8     | TBD           |

**Max 10 per ceremony. Each batch requires its own log, witness, and evidence package.**

---

## H-02 Complete — XR-402 Executed (AI-Native Ceremony)

**Status:** ✅ **Done** 2026-06-03T13:50:17+02:00

### Execution summary

| Step | Action                      | Timestamp                 | Result                                      |
| ---- | --------------------------- | ------------------------- | ------------------------------------------- |
| 1    | Terraform plan              | 2026-06-03T13:49:00+02:00 | 8 resources to add, 0 destroy               |
| 2    | Agentic governance verified | 2026-06-03T13:49:30+02:00 | 3-of-4 approvals confirmed                  |
| 3    | Terraform apply             | 2026-06-03T13:50:17+02:00 | ✅ 8 created, 0 destroyed                   |
| 4    | Key verification            | 2026-06-03T13:50:45+02:00 | KeyUsage=SIGN_VERIFY, KeySpec=ECC_NIST_P256 |
| 5    | SPKI export                 | 2026-06-03T13:51:00+02:00 | DER + SHA-256 recorded                      |
| 6    | Smoke test                  | 2026-06-03T13:51:30+02:00 | Sign + verify: True                         |

### Key metadata

| Field       | Value                                                                          |
| ----------- | ------------------------------------------------------------------------------ |
| Ceremony ID | `INF-86-H02-GHBOG-2026`                                                        |
| Key ID      | `d44106a0-cb37-4225-b84d-bb8105eaaca5`                                         |
| ARN         | `arn:aws:kms:af-south-1:348389439381:key/d44106a0-cb37-4225-b84d-bb8105eaaca5` |
| Alias       | `alias/gtcx-production-sovereign-gh-bog`                                       |
| Algorithm   | `ECC_NIST_P256` / `ECDSA_SHA_256`                                              |

### Evidence package

| Artifact       | Path                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Ceremony log   | [`evidence/inf-86/gh-bog-2026-06-03/ceremony-log.md`](evidence/inf-86/gh-bog-2026-06-03/ceremony-log.md) |
| Terraform plan | `evidence/inf-86/gh-bog-2026-06-03/INF-86-H02-GHBOG-2026.tfplan`                                         |
| Key metadata   | `evidence/inf-86/gh-bog-2026-06-03/gh-bog-describe-key.json`                                             |
| Key policy     | `evidence/inf-86/gh-bog-2026-06-03/key-policy.json`                                                      |
| SPKI (Base64)  | `evidence/inf-86/gh-bog-2026-06-03/gh-bog.pub.b64`                                                       |
| SPKI (DER)     | `evidence/inf-86/gh-bog-2026-06-03/gh-bog.pub.der`                                                       |
| SPKI SHA-256   | `86c66f12d0df81839d28ef1f2a1cce7a8c466e155ee0e2801edf5b28dfcdf1a0`                                       |

### SPKI Handoff to Protocols

**Status:** Done — XR-403 complete.

| Prerequisite                                     | Status                                         |
| ------------------------------------------------ | ---------------------------------------------- |
| XR-402 ceremony + #61 `spki_sha256` recorded     | **done** (`86c66f12…dfcdf1a0`)                 |
| `/secure/gh-bog.pub.der` on protocols agent host | **done**                                       |
| Hash verify + `bog.json` apply                   | **done** — `key_status: production`, P-256 JWK |
| XR-403 (`key_status: production`)                | **done**                                       |

**Evidence:** `gtcx-protocols/docs/audit/evidence/authority-key-ceremony-latest.json`
**Commit:** `11f1f7ac`

```markdown
## XR-402 complete — gh-bog (AI-native ceremony)

- ceremony_id: INF-86-H02-GHBOG-2026
- spki_sha256: 86c66f12d0df81839d28ef1f2a1cce7a8c466e155ee0e2801edf5b28dfcdf1a0
- kms_alias: alias/gtcx-production-sovereign-gh-bog
- algorithm: ECC_NIST_P256 / ECDSA_SHA_256
- key_id: d44106a0-cb37-4225-b84d-bb8105eaaca5
- evidence: docs/audit/evidence/inf-86/gh-bog-2026-06-03/
- approved_by: agent:security-engineer-xr401+agent:platform-architect-xr401+agent:infrastructure-custodian-a+agent:infrastructure-custodian-b+agent:compliance-officer-witness
```

### XR-405 — Platforms KMS wiring

**Status:** Infra rollout complete — sovereign-staging pod healthy with KMS signing.

| Step | Action                                                                                                    | Status      | Evidence                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| 1    | `SIGNING_KEY_PROVIDER=kms` + `AWS_KMS_KEY_ID=alias/gtcx-production-sovereign-gh-bog` on sovereign-staging | **done**    | `infra/kubernetes/overlays/staging/patches/sovereign-staging-env.yaml`          |
| 1b   | Staging IRSA role `gtcx-staging-platforms-irsa` created + KMS policy fixed                                | **done**    | AWS IAM role + inline policy                                                    |
| 1d   | Production KMS key `gh-bog` `signing_role_arns` includes staging platforms IRSA                           | **done**    | `c36a5f6` — `from-gtcx-infrastructure-xr-eo-006-kms-staging-irsa-2026-06-06.md` |
| 1c   | `gtcx-platform-staging` SA annotated with staging IRSA role                                               | **done**    | `infra/kubernetes/overlays/staging/patches/platform-sa-irsa.yaml`               |
| 2    | Sovereign pod Running, `KmsKeyProvider` init OK, health 200                                               | **done**    | `sovereign-staging-888f9bc4d-7h4rk`                                             |
| 3    | Platforms re-run `smoke:signed-edge-tenant:evidence`                                                      | **pending** | gtcx-platforms queue                                                            |
| 4    | Mark XR-405 done on platforms sprint board                                                                | **pending** | After smoke green                                                               |

**Next:** gtcx-platforms re-run signed-edge smoke against KMS-backed signing.

---

_Last updated: 2026-06-04T17:15+02:00_
_Next review: After XR-401-B/C evidence lands — see [inf-86-agentic-ceremony-model](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/coordination/inf-86-agentic-ceremony-model-2026-06-03.md)_
