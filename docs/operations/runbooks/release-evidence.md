# Release Evidence Bundle

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

Generate a machine-readable release bundle before promotion or pilot sign-off.

## Purpose

This bundle gives operators one structured artifact containing:

- immutable image refs
- SBOM artifact locations
- scan outcomes
- smoke target
- rollback target
- approval reference

It is not a substitute for CI artifacts. It is the control-plane summary that
ties those artifacts to a specific release decision.

## Command

```bash
pnpm ctl evidence release-bundle \
  --environment=staging \
  --version=v0.1.0 \
  --commit=0123456789abcdef \
  --smoke-base-url=https://api.testnet.gtcx.io \
  --rollback-target=sha-previous-good \
  --approval-ticket=CHG-2026-001 \
  --image=agx=000000000000.dkr.ecr.af-south-1.amazonaws.com/gtcx-agx:sha-0123456 \
  --image=protocols=000000000000.dkr.ecr.af-south-1.amazonaws.com/gtcx-protocols:sha-0123456 \
  --sbom=agx=artifacts/sbom-agx.cdx.json \
  --sbom=protocols=artifacts/sbom-protocols.cdx.json \
  --scan=agx=passed \
  --scan=protocols=passed
```

## Output

Default output path:

```text
infra/security/reports/release-evidence/<environment>/<utc-timestamp>/
```

Files:

- `release-evidence.json`
- `summary.md`

## Rules

- `:latest` is rejected.
- At least one image ref is required.
- Image refs must be release-tagged or digest-pinned.
- Keep generated evidence out of git unless a separate retention workflow
  explicitly requires export.
