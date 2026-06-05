---
title: 'Runtime Evidence Check'
status: 'current'
date: '2026-06-05'
owner: 'sre'
role: 'sre'
tier: 'standard'
tags: ['security', 'compliance', 'ci', 'release-evidence']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-06-05/ir-32'
trust_score: 70
autonomy_level: 'permissioned'
---

# Runtime Evidence Check

Dry-run validation of the release evidence bundle generator. This gate runs inside `validate-all` and verifies that `generate-release-evidence.mjs` can produce a complete, signed, and locally verifiable bundle in CI-like conditions.

## Purpose

- Catches regressions in the release evidence pipeline before they reach a real release.
- Validates the signing chain (NDJSON → `@gtcx/audit-signer`) without requiring live AWS credentials.
- Guarantees that every artifact required by S3-04 (live runtime evidence) is present and structurally valid.

## What It Checks

1. **Script presence** — `03-platform/tools/control-plane/generate-release-evidence.mjs` exists.
2. **Bundle generation** — The script emits `release-evidence.json` with `--build-only`.
3. **Schema validity** — `schemaVersion` and `release.commit` are present.
4. **Verification artifact** — `release-evidence-verification.json` is emitted.
5. **Signature validity** — The signed NDJSON chain verifies with the embedded public key.

## Operator Live Path

### Local (development or pre-flight)

```bash
node 03-platform/tools/03-platform/scripts/runtime-evidence-check.mjs
```

Expected output:

```text
[runtime-evidence-check] build-only release evidence bundle OK
```

Exit code `0` on success, `1` on any failure.

### In CI

This script is already wired into `validate-all` (gate 46):

```bash
node 03-platform/tools/03-platform/scripts/validate-all.mjs
```

Look for the line:

```text
✓ Runtime Evidence (dry)
```

### Manual full-bundle generation (not dry-run)

If you need to produce a real release bundle for staging or production:

```bash
pnpm ctl evidence release-bundle \
  --environment=staging \
  --version=v0.1.0 \
  --commit=$(git rev-parse HEAD) \
  --image=audit-flush=ghcr.io/gtcx-ecosystem/audit-flush:v0.1.0@sha256:... \
  --output-dir=./evidence-out
```

See [Release Evidence Bundle](./release-evidence.md) for full options.

## Failure Modes

| Symptom                                          | Cause                                         | Operator Action                                                                                        |
| ------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `generate-release-evidence.mjs missing`          | Script deleted or moved                       | Check `03-platform/tools/control-plane/` exists; restore from git if missing                           |
| `release-evidence.json not emitted`              | Script crashed or `--build-only` rejected     | Run the script manually with `--verbose` and inspect stderr                                            |
| `bundle missing schemaVersion or release.commit` | Schema regression in evidence generator       | File a bug against `03-platform/tools/control-plane/generate-release-evidence.mjs`; do not bypass      |
| `release-evidence-verification.json missing`     | Signer did not run or wrote to wrong path     | Check `audit-signer` dependency is installed (`pnpm install`)                                          |
| `signed chain verification failed`               | Key mismatch, corrupted NDJSON, or signer bug | Inspect `release-evidence.ndjson` for truncation; verify `@gtcx/audit-signer` version matches lockfile |

## Rules

- **Never bypass** this gate in CI. A failing `runtime-evidence-check` means the release pipeline cannot produce auditable artifacts.
- If the failure is a **false positive** (e.g., temporary NPM registry outage), retry the job. Do not merge with a red gate.
- The `--build-only` flag intentionally skips AWS upload. For WORM upload, use the separate `worm-upload` command documented in [Release Evidence Bundle](./release-evidence.md).
- Keep generated evidence directories out of git. They are CI artifacts, not source code.

## Evidence

When this check passes in CI, it produces no durable artifact (the temp directory is cleaned up). The pass/fail status is the evidence. For audit purposes, the CI log line `[runtime-evidence-check] build-only release evidence bundle OK` is sufficient.
