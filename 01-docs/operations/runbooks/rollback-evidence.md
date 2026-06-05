---
title: 'Rollback Evidence'
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

# Rollback Evidence

Use this runbook after a failed deploy, failed canary, or manual rollback to preserve cluster state and recovery proof.

The evidence bundle is generated locally and written under `04-ship/security/reports/rollback-evidence/`. That path is already ignored by git and should stay uncommitted unless a separate evidence retention process requires export.

## Capture Command

```bash
./04-ship/03-platform/scripts/capture-rollback-evidence.sh testnet-pilot \
  --reason=failed-canary \
  --scenario="bad revision rolled back after failed health check" \
  --previous-revision=sha-previous \
  --failed-revision=sha-failed \
  --smoke-base-url=https://api.testnet.gtcx.trade
```

Production example:

```bash
./04-ship/03-platform/scripts/capture-rollback-evidence.sh production \
  --reason=post-rollback-health-check \
  --scenario="production rollback after failed health check" \
  --previous-revision=sha-previous \
  --failed-revision=sha-failed \
  --smoke-base-url=https://api.gtcx.trade
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

[04-ship/03-platform/scripts/deploy.sh](../../../04-ship/03-platform/scripts/deploy.sh) now attempts to capture rollback evidence automatically after `--rollback` completes or a production health-check rollback is triggered.

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
