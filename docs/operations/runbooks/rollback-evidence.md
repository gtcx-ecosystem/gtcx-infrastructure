# Rollback Evidence

Use this runbook after a failed deploy, failed canary, or manual rollback to preserve cluster state and recovery proof.

The evidence bundle is generated locally and written under `infra/security/reports/rollback-evidence/`. That path is already ignored by git and should stay uncommitted unless a separate evidence retention process requires export.

## Capture Command

```bash
./infra/scripts/capture-rollback-evidence.sh staging \
  --reason=failed-canary \
  --smoke-base-url=https://api.testnet.gtcx.io
```

Production example:

```bash
./infra/scripts/capture-rollback-evidence.sh production \
  --reason=post-rollback-health-check \
  --smoke-base-url=https://api.gtcx.io
```

## What It Captures

- deployment list and pod list
- rollout history for each `app.kubernetes.io/part-of=gtcx` deployment
- deployment descriptions
- services and ingress state
- namespace events
- one smoke or health check result if a base URL or local pod probe is available

## Automatic Capture

[infra/scripts/deploy.sh](../../../infra/scripts/deploy.sh) now attempts to capture rollback evidence automatically after `--rollback` completes or a production health-check rollback is triggered.

If the automatic capture fails, run the command manually and preserve the output directory.

## Minimum Evidence To Preserve

- failed revision identifier or image tag
- rollback timestamp
- rollout history before and after rollback
- post-rollback health result
- any linked incident or approval ticket

## Related

- [deploy.md](./deploy.md)
- [fine-tune-workflow-operations.md](./fine-tune-workflow-operations.md)
