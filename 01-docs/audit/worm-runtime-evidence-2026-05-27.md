---
title: 'WORM Runtime Evidence'
status: 'final'
date: '2026-05-27'
owner: 'compliance-platform'
tier: 'critical'
tags: ['audit', 'worm', 'object-lock', 'evidence']
review_cycle: 'monthly'
source_audit: '01-docs/05-audit/master-audit-2026-05-27.md'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# WORM Runtime Evidence - 2026-05-27

## Summary

This evidence closes the staging WORM runtime proof requested by the 2026-05-27 master audit remediation plan.

| Control                | Result | Evidence                                                                                                                                     |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Staging Object Lock    | PASS   | `gtcx-worm-audit-staging-af-south-1` has Object Lock enabled with COMPLIANCE retention for 2557 days.                                        |
| Production Object Lock | PASS   | `gtcx-worm-audit-production-af-south-1` has Object Lock enabled with COMPLIANCE retention for 2557 days.                                     |
| Signed staging record  | PASS   | Staging WORM object written at `remediation-evidence/2026-05-27/master-audit-remediation.ndjson`.                                            |
| Offline verification   | PASS   | `@gtcx/audit-signer` verified the NDJSON chain as valid.                                                                                     |
| Testnet-pilot bucket   | OPEN   | `gtcx-worm-audit-testnet-pilot-af-south-1` is not present in the AWS account. Terraform wires the module, but deployment evidence is absent. |
| Public staging health  | OPEN   | `https://api.staging.gtcx.trade/health` returns ALB `403`; document as protected/blocked until an authenticated smoke path is captured.      |

## AWS Object Lock Evidence

### Staging Bucket

Command:

```bash
aws s3api get-object-lock-configuration \
  --bucket gtcx-worm-audit-staging-af-south-1 \
  --region af-south-1
```

Observed result:

```json
{
  "ObjectLockConfiguration": {
    "ObjectLockEnabled": "Enabled",
    "Rule": {
      "DefaultRetention": {
        "Mode": "COMPLIANCE",
        "Days": 2557
      }
    }
  }
}
```

### Production Bucket

Command:

```bash
aws s3api get-object-lock-configuration \
  --bucket gtcx-worm-audit-production-af-south-1 \
  --region af-south-1
```

Observed result:

```json
{
  "ObjectLockConfiguration": {
    "ObjectLockEnabled": "Enabled",
    "Rule": {
      "DefaultRetention": {
        "Mode": "COMPLIANCE",
        "Days": 2557
      }
    }
  }
}
```

## Signed Runtime Record

Local signed NDJSON record:

```text
04-ship/security/reports/worm-evidence/2026-05-27/master-audit-remediation.ndjson
```

SHA-256:

```text
d5d71d57159d75f0656aa4616f3775e90da565ada0c49ded9a8e868e82e00149
```

Offline verifier output:

```json
{
  "valid": true,
  "firstInvalidIndex": -1,
  "reason": "all records valid"
}
```

## Staging WORM Object

Upload command required the bucket policy's explicit KMS encryption header:

```bash
aws s3api put-object \
  --bucket gtcx-worm-audit-staging-af-south-1 \
  --region af-south-1 \
  --key remediation-evidence/2026-05-27/master-audit-remediation.ndjson \
  --body 04-ship/security/reports/worm-evidence/2026-05-27/master-audit-remediation.ndjson \
  --server-side-encryption aws:kms \
  --metadata sha256=d5d71d57159d75f0656aa4616f3775e90da565ada0c49ded9a8e868e82e00149,evidence=master-audit-remediation-2026-05-27
```

Observed upload result:

```json
{
  "ETag": "\"576f7bd5490c9b06b9a76e46fdea145b\"",
  "ChecksumCRC64NVME": "KJDW3skKQZU=",
  "ChecksumType": "FULL_OBJECT",
  "ServerSideEncryption": "aws:kms",
  "VersionId": "uQu0ST2hh18Xe2s9QoDvRR1Z36bTRzQ4",
  "SSEKMSKeyId": "arn:aws:kms:af-south-1:348389439381:key/b88415f3-8e71-457d-8295-e193f39989ef",
  "BucketKeyEnabled": true
}
```

Observed object metadata:

```json
{
  "LastModified": "2026-05-27T17:42:59+00:00",
  "ContentLength": 1046,
  "ETag": "\"576f7bd5490c9b06b9a76e46fdea145b\"",
  "VersionId": "uQu0ST2hh18Xe2s9QoDvRR1Z36bTRzQ4",
  "ServerSideEncryption": "aws:kms",
  "Metadata": {
    "sha256": "d5d71d57159d75f0656aa4616f3775e90da565ada0c49ded9a8e868e82e00149",
    "evidence": "master-audit-remediation-2026-05-27"
  },
  "SSEKMSKeyId": "arn:aws:kms:af-south-1:348389439381:key/b88415f3-8e71-457d-8295-e193f39989ef",
  "BucketKeyEnabled": true,
  "ObjectLockMode": "COMPLIANCE",
  "ObjectLockRetainUntilDate": "2033-05-27T17:42:58.404000+00:00"
}
```

## Testnet-Pilot Decision

The AWS account currently contains only:

```json
["gtcx-worm-audit-production-af-south-1", "gtcx-worm-audit-staging-af-south-1"]
```

`aws s3api head-bucket --bucket gtcx-worm-audit-testnet-pilot-af-south-1 --region af-south-1` returned `404 Not Found`.

Decision: treat testnet-pilot WORM as a deployment gap, not an architectural exception. The Terraform environment already includes `module "worm_audit"` and outputs `worm_audit_bucket_name`; the missing evidence is an applied environment and post-apply bucket proof.

## Runtime Endpoint Evidence

`curl -fsSI https://api.staging.gtcx.trade/health` returned HTTP `403` from `awselb/2.0`.

Interpretation: the public unauthenticated health path is not currently available as audit evidence. This is no longer a Kustomize render blocker, but it remains a runtime evidence gap until the team captures an authenticated smoke check or exposes a deliberately safe health endpoint.

## Re-Audit Impact

This artifact closes the core staging WORM proof:

- Object Lock is enabled.
- A signed record exists in WORM.
- The record has an immutable version ID.
- The record is retained in COMPLIANCE mode until 2033-05-27.
- The record verifies offline with the repo signer.

Remaining WORM-related audit risk is limited to testnet-pilot deployment proof and authenticated runtime endpoint evidence.
