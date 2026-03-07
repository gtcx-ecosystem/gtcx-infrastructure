# GA Release Readiness Tracker

**Release**: [Service Name] v[X.Y]
**Owner**: [Team Name]
**Full-stack GA status**: See `[path-to-ga-audit-document]`

---

## Gate Status

| Gate                            | Owner      | Status  | Notes                                            |
| ------------------------------- | ---------- | ------- | ------------------------------------------------ |
| Security remediation complete   | Security   | Pending | [Sprint N] complete ([date])                     |
| Pen test complete               | Security   | Pending | Vendor [name] — execution [date]                 |
| Dependency scans clean          | Security   | Pending | Run `pnpm audit` / `pip audit`; no critical/high |
| SAST clean                      | Security   | Pending | CodeQL / [tool] scan ([date])                    |
| Internal auth + mTLS            | Security   | Pending | Verified in [environment]                        |
| Perf targets (service-specific) | Platform   | Pending | [X] req/s at p95 < [Yms]                         |
| Error rate < 1%                 | Platform   | Pending | [X]% at peak load                                |
| OpenAPI v[X] published          | Platform   | Pending | Spec versioned and hosted                        |
| SDKs aligned                    | Platform   | Pending | [languages] updated                              |
| Developer portal content        | Product    | Pending | MVP docs + portal page                           |
| Monitoring dashboards           | Platform   | Pending | Grafana dashboards + alert rules                 |
| Alerting configured             | Platform   | Pending | [PagerDuty / Opsgenie] + [Slack] routing         |
| Runbooks updated                | Platform   | Pending | Incident + rollback runbooks                     |
| SOC2 evidence pipeline          | Compliance | Pending | Evidence archived to [path]                      |
| Change management evidence      | Compliance | Pending | Export script + doc added                        |
| Audit log verification          | Compliance | Pending | Verification script + doc added                  |

---

## Blockers

List open blockers here. Remove entries as blockers are resolved.

1. [Blocker description] — Owner: [Name] — ETA: [date]

---

## Evidence Log

- `[path-to-evidence-log]`
- `[path-to-evidence-summary]`

---

## Sign-off

| Area       | Owner           | Status  | Date |
| ---------- | --------------- | ------- | ---- |
| Security   | CISO            | Pending |      |
| Platform   | CTO             | Pending |      |
| Product    | PM              | Pending |      |
| Compliance | Compliance Lead | Pending |      |
