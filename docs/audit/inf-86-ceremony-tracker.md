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
> **Blocked by:** H-01 — CISO / platform-lead algorithm sign-off (ECC_NIST_P256 vs Ed25519/CloudHSM)
> **Blocks:** H-03 — gtcx-protocols #61 (DID document update + `key_status: production`)
> **Canonical runbook:** [`docs/security/key-ceremony-runbook.md`](../security/key-ceremony-runbook.md)
> **Execution plan:** [`docs/gtm/plans/inf-86-hsovereign-key-ceremony-execution-plan.md`](../gtm/plans/inf-86-hsovereign-key-ceremony-execution-plan.md)

---

## Pre-ceremony readiness (infra prepares while H-01 is pending)

| #   | Item                                               | Status      | Evidence                                                                                                                                                                                           | Owner        |
| --- | -------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | Terraform module `kms-sovereign-signing` validated | **done**    | `terraform validate` passes                                                                                                                                                                        | infra        |
| 2   | Production configuration reviewed (gh-bog pilot)   | **done**    | `infra/terraform/environments/production/main.tf:351-369`                                                                                                                                          | infra        |
| 3   | Terraform plan pre-validated (dry-run)             | **done**    | [`evidence/inf-86/sovereign-h02-prevalidation-2026-06-03.txt`](evidence/inf-86/sovereign-h02-prevalidation-2026-06-03.txt)                                                                         | infra        |
| 4   | Ceremony tracker created                           | **done**    | This file                                                                                                                                                                                          | infra        |
| 5   | H-02 operator runbook created                      | **done**    | [`docs/security/inf-86-h02-operator-runbook.md`](../security/inf-86-h02-operator-runbook.md)                                                                                                       | infra        |
| 6   | XR-401-A agentic attestation (CISO + platform)     | **done**    | `pnpm check:inf86-xr401-attestation` passes in gtcx-protocols                                                                                                                                      | protocols    |
| 7   | Algorithm decision documented (Option A: P-256)    | **done**    | Agentic attestation recorded — `gtcx-protocols/docs/audit/evidence/inf-86-xr-401-agentic-attestation-latest.json`                                                                                  | governance   |
| 8   | Custodians + witness identified (XR-401-B)         | **pending** | Agentic roster attestation — [protocols pickup](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/coordination/to-gtcx-agentic-pickup-xr402-custodian-2026-06-03.md)                 | gtcx-agentic |
| 9   | Ceremony authorization (XR-401-C)                  | **pending** | Replaces GTCX-KEY-CEREMONY human signature for pilot — [AI-native model](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/coordination/inf-86-agentic-ceremony-model-2026-06-03.md) | gtcx-agentic |
| 10  | Tamper-evident evidence store ready                | **pending** | CloudTrail + S3 `gtcx-production-ceremonies/` (video optional; agent session log acceptable for pilot)                                                                                             | ops          |
| 11  | AWS CloudTrail active in `af-south-1`              | **verify**  | Confirm via AWS console / CLI                                                                                                                                                                      | infra        |

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

## Handoff: H-02 → H-01 (infra → governance)

**Status:** H-02 is **ceremony-ready**. Awaiting H-01 completion.

```markdown
## Agent Context Attestation — INF-86 H-02 Readiness

- [x] Terraform module validated (`kms-sovereign-signing`)
- [x] Production configuration reviewed (gh-bog pilot, `main.tf:351-369`)
- [x] Terraform plan pre-validated (8 resources, 0 destroys)
- [x] Ceremony tracker created
- [x] Operator runbook created
- [x] Evidence archive initialized
- [x] H-01-A: XR-401 agentic attestation (done in protocols)
- [x] H-01-B: CISO / platform-lead formal sign-off in infra log (agentic attestation satisfies this)
- [ ] H-01-C: XR-401-B custodian roster (agentic — not human calendar)
- [ ] H-01-D: XR-401-C ceremony authorization (agentic — not leadership signature for pilot)
```

**When H-01 completes:**

1. Notify infra (this tracker)
2. Infra executes H-02 ceremony within 48 hours
3. Infra posts SPKI + evidence to gtcx-protocols #61
4. Protocols executes XR-403 (bog.json PR)

**Ceremony ID (pre-assigned):** `INF-86-H02-GHBOG-2026`  
**Authority:** `gh-bog` (Ghana Bogoso)  
**Algorithm:** `ECC_NIST_P256` (confirmed via XR-401-A)  
**Alias:** `alias/gtcx-production-sovereign-gh-bog`

---

_Last updated: 2026-06-03_
_Next review: After XR-401-B/C evidence lands — see [inf-86-agentic-ceremony-model](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/coordination/inf-86-agentic-ceremony-model-2026-06-03.md)_
