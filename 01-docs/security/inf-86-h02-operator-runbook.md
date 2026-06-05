---
title: 'inf-86 H-02 Operator Runbook'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
role: platform-architect
tier: critical
tags: ['inf-86', 'ceremony', 'KMS', 'operator', 'runbook']
review_cycle: on-change
---

# inf-86 H-02 Operator Runbook

> **Purpose:** Step-by-step operator commands for the H-02 sovereign key ceremony.
> **Prerequisite (pilot):** XR-401-A/B/C attestations committed and `pnpm check:inf86-xr401-preceremony` PASS — supersedes physical H-01 quorum ([`inf-86-agentic-ceremony-model`](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/06-coordination/inf-86-agentic-ceremony-model-2026-06-03.md)).
> **Scope:** Pilot authority `gh-bog` only. Expand to 43 authorities after pilot success.

---

## Pre-flight

```bash
# Verify AWS credentials and region
aws sts get-caller-identity
aws configure get region  # should be af-south-1

# Verify Terraform version
terraform version  # >= 1.5.0

# Navigate to production environment
cd 04-ship/terraform/environments/production

# Verify backend is configured (DO NOT apply if backend is local)
terraform workspace show  # should show "default" or "production"
```

---

## Ceremony steps

### Step 1: Identity verification (Witness)

- Check government-issued photo ID for both custodians
- Record in ceremony log:
  - Full names
  - Roles
  - ID document types and numbers (last 4 digits only)
  - Timestamp (UTC)

### Step 2: Generate Terraform plan (Custodian A)

```bash
cd 04-ship/terraform/environments/production

# Ensure clean state
git status --short  # should be clean
git log --oneline -1  # record commit hash

# Generate plan
terraform plan \
  -target=module.kms_sovereign_signing \
  -out=sovereign-gh-bog-YYYY-MM-DD.tfplan \
  2>&1 | tee sovereign-gh-bog-YYYY-MM-DD-plan.log

# Verify: plan should show exactly 8 resources to create:
#   aws_cloudwatch_log_group.sovereign_audit
#   aws_cloudwatch_log_metric_filter.unexpected_sovereign_sign["gh-bog"]
#   aws_cloudwatch_metric_alarm.unexpected_sovereign_sign["gh-bog"]
#   aws_iam_policy.sovereign_kms["gh-bog"]
#   aws_kms_alias.sovereign["gh-bog"]
#   aws_kms_key.sovereign["gh-bog"]
#   aws_ssm_parameter.sovereign_key_arn["gh-bog"]
#   aws_ssm_parameter.sovereign_key_id["gh-bog"]
```

**STOP:** Custodian B reviews the plan log. Confirm:

- Only `gh-bog` authority is affected
- `key_spec` = `ECC_NIST_P256` (or approved algorithm)
- `signing_algorithm` = `ECDSA_SHA_256`
- No `destroy` actions

### Step 3: Apply Terraform (Custodian A)

```bash
terraform apply sovereign-gh-bog-YYYY-MM-DD.tfplan \
  2>&1 | tee sovereign-gh-bog-YYYY-MM-DD-apply.log
```

**Record in log:**

- Apply start timestamp
- Any errors or warnings
- Apply completion timestamp

### Step 4: Verify key creation (Custodian B)

```bash
# Describe key
aws kms describe-key \
  --key-id alias/gtcx-production-sovereign-gh-bog \
  --query 'KeyMetadata.[KeyId,KeyUsage,KeySpec,KeyState,DeletionDate]' \
  --output table

# Expected output:
# | KeyId        | key-UUID...          |
# | KeyUsage     | SIGN_VERIFY          |
# | KeySpec      | ECC_NIST_P256        |
# | KeyState     | Enabled              |
# | DeletionDate | None                 |

# Verify key policy
aws kms get-key-policy \
  --key-id alias/gtcx-production-sovereign-gh-bog \
  --policy-name default \
  --query 'Policy' --output text | python3 -m json.tool

# Confirm: DenyKeyExport statement present
# Confirm: Only approved signing roles in AllowSovereignSign
```

### Step 5: Verify CloudWatch alarm (Custodian B)

```bash
aws cloudwatch describe-alarms \
  --alarm-names gtcx-production-sovereign-gh-bog-unexpected-sign \
  --query 'MetricAlarms[0].[AlarmName,StateValue,MetricName]' \
  --output table

# Expected: StateValue = INSUFFICIENT_DATA (normal for new alarm)
```

### Step 6: Export public key (Custodian A)

```bash
# Export raw public key
aws kms get-public-key \
  --key-id alias/gtcx-production-sovereign-gh-bog \
  --query 'PublicKey' --output text \
  > gh-bog.pub.b64

# Convert to DER
base64 -d gh-bog.pub.b64 > gh-bog.pub.der

# Compute hash for provenance
shasum -a 256 gh-bog.pub.der > gh-bog.pub.der.sha256

# Generate JWK (requires node + jose or similar)
# If jose is available:
# node -e "
#   const fs = require('fs');
#   const { importSPKI, exportJWK } = require('jose');
#   const der = fs.readFileSync('gh-bog.pub.der');
#   // Convert DER to SPKI PEM, then to JWK
# "

# Alternative: hand off DER to protocols team for JWK/multibase conversion
```

### Step 7: Verify SSM parameters (Custodian B)

```bash
aws ssm get-parameter \
  --name /gtcx/production/kms/sovereign/gh-bog/key-id \
  --query 'Parameter.Value' --output text

aws ssm get-parameter \
  --name /gtcx/production/kms/sovereign/gh-bog/key-arn \
  --query 'Parameter.Value' --output text
```

### Step 8: Sign ceremony log (Witness)

All three participants sign the ceremony log. Digital signatures acceptable (GPG or DocuSign).

---

## Post-ceremony verification (within 24 hours)

### CloudTrail audit

```bash
# Query CloudTrail for ceremony events
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=CreateKey \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --query 'Events[?Resources[?ResourceName==`alias/gtcx-production-sovereign-gh-bog`]]' \
  --output json

# Also check: PutKeyPolicy, CreateAlias, GetPublicKey
```

### Smoke test — sign a test payload

```bash
# Sign a test message (does not affect production state)
echo "gh-bog pilot ceremony smoke test $(date -u +%Y-%m-%dT%H:%M:%SZ)" > test-payload.txt

aws kms sign \
  --key-id alias/gtcx-production-sovereign-gh-bog \
  --message fileb://test-payload.txt \
  --signing-algorithm ECDSA_SHA_256 \
  --message-type RAW \
  --query 'Signature' --output text \
  > test-signature.b64

# Verify signature
aws kms verify \
  --key-id alias/gtcx-production-sovereign-gh-bog \
  --message fileb://test-payload.txt \
  --signature fileb://test-signature.b64 \
  --signing-algorithm ECDSA_SHA_256 \
  --message-type RAW \
  --query 'SignatureValid' --output text

# Expected: true
rm test-payload.txt test-signature.b64
```

### Archive evidence

```bash
EVIDENCE_DIR="01-docs/05-audit/evidence/inf-86/gh-bog-$(date -u +%Y-%m-%d)"
mkdir -p "$EVIDENCE_DIR"

cp sovereign-gh-bog-YYYY-MM-DD-plan.log "$EVIDENCE_DIR/"
cp sovereign-gh-bog-YYYY-MM-DD-apply.log "$EVIDENCE_DIR/"
cp gh-bog.pub.der "$EVIDENCE_DIR/"
cp gh-bog.pub.der.sha256 "$EVIDENCE_DIR/"
aws kms describe-key --key-id alias/gtcx-production-sovereign-gh-bog --output json > "$EVIDENCE_DIR/describe-key.json"
aws kms get-key-policy --key-id alias/gtcx-production-sovereign-gh-bog --policy-name default --output json > "$EVIDENCE_DIR/key-policy.json"

# Upload video (operator step)
# aws s3 cp ceremony-video.mp4 s3://gtcx-production-ceremonies/YYYY-MM-DD/
```

---

## Emergency: Rollback / disable key

```bash
# Disable key immediately (both custodians must agree)
aws kms disable-key --key-id alias/gtcx-production-sovereign-gh-bog

# Verify disabled
aws kms describe-key --key-id alias/gtcx-production-sovereign-gh-bog \
  --query 'KeyMetadata.KeyState' --output text
# Expected: Disabled

# Notify stakeholders per IRP SLAs
```

---

_Last updated: 2026-06-03_
_Next review: After pilot ceremony_
