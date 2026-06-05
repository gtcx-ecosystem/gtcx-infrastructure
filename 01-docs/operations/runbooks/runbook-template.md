---
title: 'Runbook: [Service or Incident Type]'
status: 'draft'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'infrastructure', 'api', 'frontend', 'backend']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Runbook: [Service or Incident Type]

---

## 1. Incident Classification

| Severity | Definition                                        | Response Time        | Escalation        |
| -------- | ------------------------------------------------- | -------------------- | ----------------- |
| **P0**   | Full service outage or data breach                | Immediate (< 15 min) | CTO + on-call     |
| **P1**   | Partial outage, major feature broken              | < 1 hour             | Engineering lead  |
| **P2**   | Degraded performance, non-critical feature broken | < 4 hours            | Team lead         |
| **P3**   | Minor issue, cosmetic, low user impact            | < 24 hours           | Assigned engineer |

---

## 2. On-Call Rotation

| Week     | Primary On-Call | Secondary On-Call |
| -------- | --------------- | ----------------- |
| [Week 1] | [Engineer]      | [Engineer]        |
| [Week 2] | [Engineer]      | [Engineer]        |

On-call contact: [PagerDuty / Slack / Phone]

Handoff: Every [Monday] at [09:00 UTC]. Outgoing on-call must document any unresolved issues.

---

## 3. Incident Response Playbook

### 3.1 Alert Fires — First Steps (First 15 Minutes)

```
1. Acknowledge the alert in [alerting system]
2. Check the monitoring dashboard: [link]
3. Assess scope: which services are affected?
4. Post in #incidents Slack channel: "Investigating [alert name] — [timestamp]"
5. Determine severity (P0/P1/P2/P3)
6. If P0 or P1: page secondary on-call and notify engineering lead
```

### 3.2 Investigation Checklist

- [ ] Check error rate on [monitoring dashboard]
- [ ] Check latency percentiles (p50, p95, p99)
- [ ] Check recent deployments — did anything ship in the last [N] hours?
- [ ] Check dependency health (database, cache, external APIs)
- [ ] Check logs for error patterns: `[log query or command]`
- [ ] Check resource utilization (CPU, memory, disk)

### 3.3 Common Failure Scenarios

#### High Error Rate

```bash
# Check recent logs for errors
[log query command]

# Check DB connection pool
[query or command]

# Rollback if caused by recent deploy
[rollback command]
```

#### High Latency

```bash
# Check slow query log
[query command]

# Check cache hit rate
[command]

# Check instance count (scale if needed)
[scale command]
```

#### Service Down / Health Check Failing

```bash
# Check service status
[status command]

# Check recent deployment
[deployment status command]

# Restart service (last resort)
[restart command]
```

---

## 4. Escalation Procedures

| Scenario                          | Escalate To                            | How                    |
| --------------------------------- | -------------------------------------- | ---------------------- |
| P0 outage > 15 minutes unresolved | CTO + engineering lead                 | Phone call             |
| Data breach suspected             | CTO + CISO + legal                     | Phone call, then Slack |
| External API dependency down      | Third-party support + engineering lead | Support ticket + Slack |
| Database corruption               | DBA + CTO                              | Phone call             |

---

## 5. Rollback Procedures

### Application Rollback

```bash
# List recent deployments
[list revisions command]

# Roll back to previous version
[rollback command]
```

Expected recovery time: [N] minutes.

### Database Rollback (Last Resort)

```bash
# Identify target restore point
[command]

# Restore (this will cause downtime)
[restore command]
```

Expected recovery time: [N] hours. Coordinate with CTO before executing.

---

## 6. Communication Templates

### Internal Status Update (every 30 min during P0/P1)

```
[HH:MM UTC] Incident Update — [Service]

Status: [Investigating / Identified / Mitigating / Resolved]
Impact: [Description of user impact]
Current action: [What we are doing right now]
Next update: [HH:MM UTC]
```

### External Status Page Update

```
[Status: Investigating / Identified / Monitoring / Resolved]
We are [investigating / aware of] [brief description] affecting [surface].
[Impact description.]
Next update by [HH:MM UTC].
```

---

## 7. Post-Mortem

A post-mortem is required for all P0 and P1 incidents.

Post-mortem must be completed within [N] business days. Use this template:

```markdown
# Post-Mortem: [Incident Name] — [YYYY-MM-DD]

**Severity**: [P0/P1]
**Duration**: [Start time] → [End time] ([N] minutes)
**Impact**: [Number of users affected, services impacted]

## Timeline

[HH:MM] — [Event]

## Root Cause

[What actually caused this]

## Contributing Factors

[What made it worse or harder to detect]

## What Went Well

[Things that worked during the incident]

## Action Items

| Item  | Owner      | Due    |
| ----- | ---------- | ------ |
| [Fix] | [Engineer] | [Date] |
```

---

_Runbooks are living documents. Update after every incident where the playbook was used._
