# Automated Rollback Runbook

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

## Overview

GTCX supports automated and manual rollback with full evidence capture.

## Triggers

| Trigger                | Threshold             | Action                           |
| ---------------------- | --------------------- | -------------------------------- |
| Canary error rate      | > 1% for 2 minutes    | Auto-delete canary deployment    |
| Fast burn alert        | > 14.4x for 5 minutes | Page on-call, recommend rollback |
| Manual approval ticket | Any time              | Operator-initiated rollback      |

## Manual Rollback

```bash
# Rollback production to previous revision
gtcx-ctl deploy rollback --environment=production

# Capture evidence
gtcx-ctl evidence rollback-capture --environment=production --reason="SLO breach"
```

## Automated Rollback Wiring (Optional)

To enable automatic rollback on SLO breach:

1. Configure PagerDuty webhook to call `gtcx-ctl deploy rollback`
2. Set environment variable `GTCX_AUTO_ROLLBACK_ENABLED=true`
3. Ensure the CI role has `kubectl` access to the production namespace

## Evidence Collection

Every rollback generates an evidence bundle:

```
infra/security/reports/rollback-evidence/
  └── 2026-05-06T14-30-00-production/
      ├── rollout-history.json
      ├── pod-status.json
      ├── events.json
      └── smoke-test-results.json
```

## Post-Rollback Checklist

- [ ] Verify previous revision is serving traffic
- [ ] Confirm error rate returns to baseline
- [ ] Notify `#gtcx-ops` channel
- [ ] Schedule post-mortem within 24 hours
- [ ] Update incident tracking (Jira/PagerDuty)
