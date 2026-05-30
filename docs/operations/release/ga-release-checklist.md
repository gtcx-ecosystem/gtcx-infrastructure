---
title: '[Service Name] v[X.Y] GA Release Checklist'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# [Service Name] v[X.Y] GA Release Checklist

**Owner**: [Team Name]
**Scope**: [Service / Product Name]
**Target**: v[X.Y] GA

---

## Release Gates

### Security

- [ ] All security remediation sprints completed (Critical/High/Medium/Low)
- [ ] Dependency scans clean (no critical/high CVEs)
- [ ] SAST clean (no critical/high findings)
- [ ] Pen test complete and no critical findings
- [ ] mTLS + internal auth verified for internal routes

### Performance

- [ ] Sustained {target-rps} req/s at p95 < {target-latency}ms
- [ ] Error rate < {target-error-rate}%
- [ ] Load test results archived

### Compliance

- [ ] SOC2 evidence pipeline operational
- [ ] ISO 27001 evidence pipeline operational
- [ ] Audit log retention + hash chain verified
- [ ] Change management evidence archived

### Documentation

- [ ] OpenAPI published and versioned
- [ ] SDKs updated and aligned with auth headers
- [ ] Developer portal content complete

### Reliability & Ops

- [ ] Monitoring dashboards in place (latency, error rate, saturation)
- [ ] Alerting configured
- [ ] Runbooks updated (incident response, rollback)
- [ ] DR drill logged with measured RPO/RTO
- [ ] SLA metrics logged for {sla-window}-day uptime window

---

## Sign-off

| Area       | Owner           | Sign-off | Date |
| ---------- | --------------- | -------- | ---- |
| Security   | CISO            | [ ]      |      |
| Platform   | CTO             | [ ]      |      |
| Product    | PM              | [ ]      |      |
| Compliance | Compliance Lead | [ ]      |      |

---

_This checklist is a template. All gates must be ✅ before GA release is authorized._
