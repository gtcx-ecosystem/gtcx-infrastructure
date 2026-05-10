# Rollback Evidence

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

Use this runbook after a failed deploy, failed canary, or manual rollback to preserve cluster state and recovery proof.

The evidence bundle is generated locally and written under `infra/security/reports/rollback-evidence/`. That path is already ignored by git and should stay uncommitted unless a separate evidence retention process requires export.

## Capture Command

```bash
./infra/scripts/capture-rollback-evidence.sh testnet-pilot \
  --reason=failed-canary \
  --scenario="bad revision rolled back after failed health check" \
  --previous-revision=sha-previous \
  --failed-revision=sha-failed \
  --smoke-base-url=https://api.testnet.gtcx.io
```

Production example:

```bash
./infra/scripts/capture-rollback-evidence.sh production \
  --reason=post-rollback-health-check \
  --scenario="production rollback after failed health check" \
  --previous-revision=sha-previous \
  --failed-revision=sha-failed \
  --smoke-base-url=https://api.gtcx.io
```

## What It Captures

- deployment list and pod list
- rollout history for each `app.kubernetes.io/part-of=gtcx` deployment
- deployment descriptions
- services and ingress state
- namespace events
- one smoke or health check result if a base URL or local pod probe is available
- `rollback-evidence.json` with the machine-readable fields consumed by the `gtcx-intelligence` deployment smoke evidence gate

## Automatic Capture

[infra/scripts/deploy.sh](../../../infra/scripts/deploy.sh) now attempts to capture rollback evidence automatically after `--rollback` completes or a production health-check rollback is triggered.

If the automatic capture fails, run the command manually and preserve the output directory.

## Minimum Evidence To Preserve

- failed revision identifier or image tag
- `rollback-evidence.json`
- rollback timestamp
- rollout history before and after rollback
- post-rollback health result
- post-rollback metrics result from `/metrics`
- any linked incident or approval ticket

## Related

- [deploy.md](./deploy.md)
- [fine-tune-workflow-operations.md](./fine-tune-workflow-operations.md)
