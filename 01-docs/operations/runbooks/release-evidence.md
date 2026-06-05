---
title: 'Release Evidence Bundle'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'infrastructure', 'api', 'frontend', 'devops']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Release Evidence Bundle

Generate a machine-readable release bundle before promotion or pilot sign-off.

## Purpose

This bundle gives operators one structured artifact containing:

- immutable image refs
- SBOM artifact locations
- scan outcomes
- validation gate outcomes
- evidence pointers
- smoke target
- rollback target
- approval reference
- signed NDJSON proof
- local verification result
- WORM upload metadata

It is not a substitute for CI artifacts. It is the control-plane summary that
ties those artifacts to a specific release decision.

## Command

```bash
pnpm ctl evidence release-bundle \
  --environment=staging \
  --version=v0.1.0 \
  --commit=0123456789abcdef \
  --smoke-base-url=https://api.testnet.gtcx.trade \
  --rollback-target=sha-previous-good \
  --approval-ticket=CHG-2026-001 \
  --image=agx=000000000000.dkr.ecr.af-south-1.amazonaws.com/gtcx-agx:sha-0123456 \
  --image=protocols=000000000000.dkr.ecr.af-south-1.amazonaws.com/gtcx-protocols:sha-0123456 \
  --sbom=agx=artifacts/sbom-agx.cdx.json \
  --sbom=protocols=artifacts/sbom-protocols.cdx.json \
  --scan=agx=passed \
  --scan=protocols=passed \
  --gate=lint=pass \
  --gate=test=pass \
  --gate=build=pass \
  --evidence=score-ledger=01-docs/05-audit/score-evidence-ledger.json \
  --worm-bucket=gtcx-worm-audit-staging-af-south-1 \
  --worm-key=release-evidence/staging/v0.1.0/release-evidence.ndjson
```

## Output

Default output path:

```text
04-ship/security/reports/release-evidence/<environment>/<utc-timestamp>/
```

Files:

- `release-evidence.json`
- `summary.md`
- `release-evidence.ndjson`
- `release-evidence-verification.json`
- `worm-upload.json`
- `worm-upload-execution.json` after WORM upload or dry-run validation

## WORM Upload

Use dry-run mode in CI or local review to validate the manifest and planned upload without AWS credentials:

```bash
pnpm ctl evidence worm-upload \
  --manifest=04-ship/security/reports/release-evidence/staging/20260527T120000Z/worm-upload.json \
  --dry-run
```

Use non-dry-run mode only with scoped AWS credentials for the target bucket:

```bash
pnpm ctl evidence worm-upload \
  --manifest=04-ship/security/reports/release-evidence/staging/20260527T120000Z/worm-upload.json \
  --expected-mode=COMPLIANCE \
  --min-retention-days=2550
```

The wrapper validates the signed NDJSON hash before upload, writes the object with `aws s3api put-object`, then captures `head-object` and `get-object-retention` evidence into `worm-upload-execution.json`.

## Rules

- `:latest` is rejected.
- At least one image ref is required.
- Image refs must be release-tagged or digest-pinned.
- Gate status values must be `pass`, `fail`, `warn`, or `skipped`.
- `release-evidence.ndjson` must verify with `@gtcx/audit-signer` before upload.
- `worm-upload.json` is an upload manifest, not proof of upload. `worm-upload-execution.json` is the upload and retention evidence artifact.
- Keep generated evidence out of git unless a separate retention workflow
  explicitly requires export.
