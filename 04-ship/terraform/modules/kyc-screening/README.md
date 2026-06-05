---
title: 'kyc-screening Terraform Module'
status: 'current'
date: '2026-05-30'
owner: 'platform-engineering'
tier: 'standard'
tags: ['terraform', 'lambda', 'kyc', 'screening', 'ai-native']
review_cycle: 'on-change'
---

# `kyc-screening`

Ambient KYC document screening Lambda. AI-native Pattern #1
(Ambient Intelligence): screening runs in the background as
documents arrive, so the operator sees the result the moment they
open the document UI — no "Run AI" button.

## What this ships

- Lambda function (`gtcx-<env>-kyc-screening`) running Node.js 20.x
  on a 30s timeout, 512MB memory.
- IAM role with least-privilege access:
  - `s3:GetObject` scoped to `kyc/*` (cannot read its own sidecars).
  - `s3:PutObject` scoped to `kyc/*.screening.json` (cannot overwrite
    KYC documents themselves).
  - `kms:Decrypt` + `kms:GenerateDataKey` on the bucket CMK.
  - `secretsmanager:GetSecretValue` only when `screening_provider =
comply-advantage`.
- Dead-letter queue (SQS, 14-day retention) for failed invocations.
- Lambda permission allowing the kyc-documents bucket to invoke.
- Reserved concurrency cap of 50 to protect downstream provider rate
  limits.
- X-Ray tracing enabled.

## What this does NOT ship

- The S3 event notification on the existing `kyc-documents` bucket.
  Flipping a production bucket's event config is a deliberate
  integration step; the operator wires
  `aws_lambda_function.screening.arn` into the kyc-documents module's
  notification block AFTER reviewing this module's first-apply plan.

## Lambda packaging

The Lambda code lives in `03-platform/tools/kyc-screening/`. To package:

```bash
cd 03-platform/tools/kyc-screening
zip -r dist/kyc-screening.zip 03-platform/src/ package.json
```

The packaged path is then referenced by `var.lambda_package_path`
(default `../../../../03-platform/tools/kyc-screening/dist/kyc-screening.zip`).

## Usage

```hcl
module "kyc_screening" {
  source = "../../modules/kyc-screening"

  environment                = "staging"
  kyc_documents_bucket_arn   = module.kyc_documents.bucket_arn
  kyc_documents_kms_key_arn  = module.kyc_documents.kms_key_arn
  screening_provider         = "local"

  # When ready to go to production with ComplyAdvantage:
  # screening_provider                  = "comply-advantage"
  # comply_advantage_api_key_secret_arn = aws_secretsmanager_secret.comply_advantage_key.arn
}
```

After applying, wire the S3 event notification onto the
kyc-documents bucket pointing at `module.kyc_screening.lambda_arn`.

## Providers

| Provider           | Status                      | Notes                                                                                             |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------- |
| `local`            | Default, deterministic mock | Hash-derived verdict (80% clear / 15% review / 5% block). Free, reproducible. Staging + dev only. |
| `comply-advantage` | Stub (throws if invoked)    | Production provider; adapter awaits a signed API agreement + credential rotation policy.          |

## Result schema

Each screening produces a sibling `<key>.screening.json` in the
same bucket:

```json
{
  "documentKey": "kyc/did:abc/passport/x.png",
  "provider": "local",
  "screenedAt": "2026-05-30T19:00:00.000Z",
  "verdict": "clear",
  "score": 0.42,
  "reasons": [],
  "providerRequestId": "local:abc123..."
}
```

## Operational notes

- **DLQ depth alert.** If `aws_sqs_queue.dlq` depth > 0, a screening
  failed and was retried by Lambda 2x. Investigate via X-Ray trace +
  the DLQ message body. (Alert + runbook owned by SRE; not in this
  module.)
- **Idempotency.** Re-uploading the same key triggers a new version
  and a new screening. The sidecar IS overwritten — operators
  comparing pre/post screening should query S3 ObjectVersionId.
- **No PII leaves AWS.** The `local` provider runs entirely in the
  Lambda; the `comply-advantage` provider sends document metadata
  (hashes, not contents) per the configured DPA.
