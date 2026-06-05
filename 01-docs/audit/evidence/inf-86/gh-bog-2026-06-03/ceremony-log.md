---
ceremony_id: INF-86-H02-GHBOG-2026
date: 2026-06-03T13:50:17+02:00
owner: gtcx-infrastructure
status: current
authority: gh-bog
alias: alias/gtcx-production-sovereign-gh-bog
algorithm: ECC_NIST_P256
signing_scheme: ECDSA_SHA_256
---

# Ceremony Log — INF-86-H02-GHBOG-2026

## Execution

| Step | Action                               | Timestamp                 |
| ---- | ------------------------------------ | ------------------------- |
| 1    | Terraform plan generated             | 2026-06-03T13:49:00+02:00 |
| 2    | Agentic governance verified (3-of-4) | 2026-06-03T13:49:30+02:00 |
| 3    | Terraform apply executed             | 2026-06-03T13:50:17+02:00 |
| 4    | Key verified (describe-key)          | 2026-06-03T13:50:45+02:00 |
| 5    | SPKI exported (DER)                  | 2026-06-03T13:51:00+02:00 |
| 6    | Smoke test (sign + verify)           | 2026-06-03T13:51:30+02:00 |

## Key Metadata

| Field              | Value                                                                          |
| ------------------ | ------------------------------------------------------------------------------ |
| Key ID             | `d44106a0-cb37-4225-b84d-bb8105eaaca5`                                         |
| ARN                | `arn:aws:kms:af-south-1:348389439381:key/d44106a0-cb37-4225-b84d-bb8105eaaca5` |
| Key Usage          | SIGN_VERIFY                                                                    |
| Key Spec           | ECC_NIST_P256                                                                  |
| Signing Algorithms | ECDSA_SHA_256                                                                  |
| State              | Enabled                                                                        |
| Creation Date      | 2026-06-03T13:50:17.008000+02:00                                               |

## Agentic Attestation

| Role                       | Agent ID                                                 | Trust Score |
| -------------------------- | -------------------------------------------------------- | ----------- |
| Security Engineer          | `agent://gtcx-agentic/security-engineer-xr401`           | 85          |
| Platform Architect         | `agent://gtcx-agentic/platform-architect-xr401`          | 85          |
| Infrastructure Custodian A | `agent://gtcx-infrastructure/infrastructure-custodian-a` | 85          |
| Infrastructure Custodian B | `agent://gtcx-infrastructure/infrastructure-custodian-b` | 85          |
| Compliance Witness         | `agent://gtcx-agentic/compliance-officer-witness`        | 80          |

## Evidence

| Artifact            | Path                           |
| ------------------- | ------------------------------ |
| Terraform plan      | `INF-86-H02-GHBOG-2026.tfplan` |
| Key metadata        | `gh-bog-describe-key.json`     |
| Key policy          | `key-policy.json`              |
| Public key (Base64) | `gh-bog.pub.b64`               |
| Public key (DER)    | `gh-bog.pub.der`               |
| SPKI SHA-256        | `gh-bog.pub.der.sha256`        |

## SPKI Hash

```
86c66f12d0df81839d28ef1f2a1cce7a8c466e155ee0e2801edf5b28dfcdf1a0  gh-bog.pub.der
```

## Smoke Test

- Input: `INF-86-H02-GHBOG-2026 smoke test 2026-06-03T...`
- Sign: ✅ Success
- Verify: ✅ True

---

_Ceremony executed by AI-native multi-agent governance model._
_No physical quorum required for pilot — see `01-docs/09-security/inf-86-ai-native-ceremony-redesign.md`._
