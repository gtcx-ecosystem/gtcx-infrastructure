---
title: 'Key Ceremony Runbook'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Key Ceremony Runbook

**Purpose:** Document the procedures for KMS signing key generation, rotation, and revocation.
**Compliance:** FFIEC Key Management, PCI-DSS Requirement 3.6, ISO 27001 A.10.1
**Review cycle:** Quarterly (or after any key compromise event)

---

## 1. Key Generation Ceremony

### Prerequisites

- [ ] Two authorized key custodians present (dual-control requirement)
- [ ] One independent witness (security officer or auditor)
- [ ] Video recording equipment ready (tamper-evident storage)
- [ ] Terraform plan reviewed and approved (PR merged)
- [ ] AWS CloudTrail confirmed active for target region
- [ ] Incident response plan accessible to all participants

### Procedure

```
Step 1: Verify identity of all participants
        - Government ID check for each custodian
        - Record names, roles, timestamps in ceremony log

Step 2: Custodian A initiates Terraform apply
        $ cd 04-ship/terraform/environments/{env}
        $ terraform plan -target=module.kms_signing -out=kms.tfplan
        $ terraform apply kms.tfplan

Step 3: Custodian B verifies key creation
        $ aws kms describe-key --key-id alias/gtcx-{env}-signing
        - Confirm: KeyUsage=SIGN_VERIFY, KeySpec=ECC_NIST_P256
        - Confirm: KeyState=Enabled
        - Confirm: DeletionDate=null

Step 4: Both custodians verify key policy
        $ aws kms get-key-policy --key-id alias/gtcx-{env}-signing --policy-name default
        - Confirm: Only approved roles in Sign statement
        - Confirm: DenyKeyExport statement present

Step 5: Witness signs ceremony log
        - All participants sign (physical or digital signature)
        - Video recording saved to tamper-evident storage
```

### Ceremony Log Template

| Field             | Value                                  |
| ----------------- | -------------------------------------- |
| Date              | YYYY-MM-DD HH:MM UTC                   |
| Environment       | testnet / staging / production         |
| Key ID            | aws_kms_key.signing.key_id             |
| Key ARN           | aws_kms_key.signing.arn                |
| Algorithm         | ECC_NIST_P256                          |
| Custodian A       | Name, Role                             |
| Custodian B       | Name, Role                             |
| Witness           | Name, Role                             |
| Video Location    | s3://gtcx-{env}-ceremonies/YYYY-MM-DD/ |
| Next Rotation Due | YYYY-MM-DD (90 days from creation)     |

---

## 2. Key Rotation Ceremony

Asymmetric KMS keys do not support automatic rotation. Rotation is performed via alias swap.

### Rotation Procedure

```
Step 1: Generate new key (same ceremony as §1)
        - New key created alongside old key
        - Both keys active during grace period

Step 2: Update alias to point to new key
        $ aws kms update-alias \
            --alias-name alias/gtcx-{env}-signing \
            --target-key-id {new-key-id}

Step 3: Update SSM parameters
        $ terraform apply -target=module.kms_signing

Step 4: Grace period (30 days default)
        - Old key remains ENABLED for signature verification
        - New key used for all new signatures
        - Monitor: no Sign calls to old key after 48 hours

Step 5: Disable old key
        $ aws kms disable-key --key-id {old-key-id}

Step 6: Schedule deletion (after grace period expires)
        $ aws kms schedule-key-deletion \
            --key-id {old-key-id} \
            --pending-window-in-days 30
```

### Rotation Schedule

| Environment | Interval | Grace Period | Next Due |
| ----------- | -------- | ------------ | -------- |
| testnet     | 90 days  | 30 days      | TBD      |
| staging     | 90 days  | 30 days      | TBD      |
| production  | 90 days  | 30 days      | TBD      |

---

## 3. Emergency Key Revocation

**Trigger:** Suspected key compromise, unauthorized signing activity, or CloudWatch alarm.

### Immediate Actions (< 15 minutes)

```
Step 1: Disable the compromised key
        $ aws kms disable-key --key-id {compromised-key-id}

Step 2: Generate emergency replacement key
        - Follow §1 Key Generation Ceremony (expedited: single custodian + CISO)
        - Document deviation from dual-control in incident report

Step 3: Update alias to replacement key
        $ aws kms update-alias \
            --alias-name alias/gtcx-{env}-signing \
            --target-key-id {replacement-key-id}

Step 4: Restart replay-guard pods to pick up new key
        $ kubectl rollout restart deployment/replay-guard -n gtcx-{env}

Step 5: Notify stakeholders
        - Security team: immediate
        - Engineering: within 1 hour
        - Board/regulators: per IRP notification SLAs
```

### Post-Revocation

- [ ] Schedule deletion of compromised key (30-day pending window)
- [ ] Audit all Sign API calls to compromised key (CloudTrail)
- [ ] Review and update IAM policies if access was unauthorized
- [ ] Conduct post-incident review within 48 hours
- [ ] Update ceremony log with revocation details

---

## 4. Evidence Package

For each key ceremony, the following evidence is retained for 7 years:

1. **Ceremony log** — Signed by all participants
2. **Video recording** — Stored in tamper-evident S3 bucket
3. **CloudTrail events** — CreateKey, PutKeyPolicy, CreateAlias API calls
4. **Terraform plan output** — Infrastructure-as-code diff
5. **Key metadata** — `aws kms describe-key` output at creation time
6. **Witness attestation** — Independent confirmation of procedure compliance

---

_Last updated: 2026-05-08_
_Next review: 2026-08-08 (quarterly)_

## 5. Sovereign Authority Key Ceremony

Sovereign authority keys are created via the `kms-sovereign-signing` Terraform module.
Each jurisdiction / authority gets an independent KMS asymmetric key with its own alias,
IAM policy, CloudWatch alarm, and SSM parameters.

### 5.1 Prerequisites

- [ ] Algorithm decision documented (ECC_NIST_P256 vs Ed25519/CloudHSM) — **PENDING CISO / platform-lead sign-off**
- [ ] `GTCX-KEY-CEREMONY` leadership approval obtained
- [ ] Two custodians + one witness identified — **PENDING scheduling**
- [ ] Authority DID JSON-LD schema confirmed with gtcx-protocols
- [ ] Pilot authority selected (`gh-bog`) — ✅ configured in Terraform; **DO NOT APPLY YET**

> **HOLD:** Production Terraform apply is blocked until algorithm sign-off and custodian scheduling are complete. See §5.4.

### 5.2 Procedure

```
Step 1: Verify identity of all participants
        - Government ID check for custodians
        - Record names, roles, timestamps in ceremony log

Step 2: Review Terraform plan for target authority
        $ cd 04-ship/terraform/environments/production
        $ terraform plan -target=module.kms_sovereign_signing -out=sovereign.tfplan
        $ # Confirm only the target authority key is added

Step 3: Custodian A initiates apply
        $ terraform apply sovereign.tfplan

Step 4: Custodian B verifies key creation
        $ aws kms describe-key \
            --key-id alias/gtcx-production-sovereign-<authority-id>
        - Confirm: KeyUsage=SIGN_VERIFY
        - Confirm: KeySpec matches algorithm decision
        - Confirm: KeyState=Enabled
        - Confirm: DeletionDate=null

Step 5: Export public key for DID document
        $ aws kms get-public-key \
            --key-id alias/gtcx-production-sovereign-<authority-id> \
            --query 'PublicKey' --output text
        - Convert to publicKeyMultibase or publicKeyJwk per protocols schema
        - Hand off to gtcx-protocols for DID document update

Step 6: Both custodians verify key policy
        $ aws kms get-key-policy \
            --key-id alias/gtcx-production-sovereign-<authority-id> \
            --policy-name default
        - Confirm: Only approved roles in Sign statement
        - Confirm: DenyKeyExport statement present

Step 7: Witness signs ceremony log
        - All participants sign
        - Video recording saved to tamper-evident S3 storage
```

### 5.3 Sovereign Ceremony Log Template

| Field             | Value                                            |
| ----------------- | ------------------------------------------------ |
| Date              | YYYY-MM-DD HH:MM UTC                             |
| Environment       | production                                       |
| Authority ID      | e.g. `gh-bog`                                    |
| Key ID            | `aws_kms_key.sovereign[authority].key_id`        |
| Key ARN           | `aws_kms_key.sovereign[authority].arn`           |
| Alias             | `alias/gtcx-production-sovereign-<authority-id>` |
| Algorithm         | ECC_NIST_P256 / Ed25519                          |
| Custodian A       | Name, Role                                       |
| Custodian B       | Name, Role                                       |
| Witness           | Name, Role                                       |
| Video Location    | `s3://gtcx-production-ceremonies/YYYY-MM-DD/`    |
| Public Key Export | Base64 DER / publicKeyMultibase / publicKeyJwk   |
| Protocols Handoff | gtcx-protocols#61 comment URL                    |
| Next Rotation Due | YYYY-MM-DD (90 days from creation)               |

### 5.4 Pilot Hold & Expansion Guardrails

**Current status:** `HOLD` — production Terraform apply is **explicitly blocked** pending:

1. CISO / platform-lead algorithm sign-off (ECC_NIST_P256 vs Ed25519 / CloudHSM)
2. Custodian scheduling (dual-control + witness)

**Pilot constraints:**

- **Single pilot authority only:** `gh-bog` (already configured in `production/main.tf`)
- **No apply until hold lifted** — `terraform apply` for `module.kms_sovereign_signing` is prohibited
- **Post-pilot deliverables:**
  - Ceremony evidence package (§4) to compliance
  - Exported public key (base64 DER / multibase / JWK) to **gtcx-protocols** for DID document update
  - **Do not edit `key_status` in protocols** — protocols team owns DID schema and status fields

**Post-pilot expansion rules:**

- Expand `var.authorities` map to remaining 42 authorities **only after** successful `gh-bog` pilot
- Batch size: **maximum 10 authorities per Terraform apply** (to stay within KMS API rate limits and keep ceremony logs manageable)
- Each batch requires its own ceremony log, witness, and evidence package
- Total batches: 5 (10 + 10 + 10 + 10 + 2)

**Algorithm blocker note:**

AWS KMS does not support Ed25519. Options:

- **(A)** Migrate DID schema to `ECC_NIST_P256` (KMS-native, no CloudHSM cost)
- **(B)** Deploy AWS CloudHSM cluster (~$2,100/month HA pair) for Ed25519

Infra recommends **Option A** for cost and operational simplicity, but the decision is **CISO/platform-lead authority**.

---

_Last updated: 2026-06-03_
_Next review: 2026-08-08 (quarterly)_
