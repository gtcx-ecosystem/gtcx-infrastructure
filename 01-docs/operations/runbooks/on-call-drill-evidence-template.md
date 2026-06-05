---
title: 'On-Call Drill Evidence Log'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'api', 'frontend']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# On-Call Drill Evidence Log

---

## Drill Metadata

| Field              | Value                        |
| ------------------ | ---------------------------- |
| Drill ID           | `DRILL-YYYY-MM-DD-NNN`       |
| Scheduled date     | YYYY-MM-DD                   |
| Actual start (UTC) | YYYY-MM-DD HH:MM:SS          |
| Actual end (UTC)   | YYYY-MM-DD HH:MM:SS          |
| Duration           | HH:MM:SS                     |
| Scenario           | [see scenario library below] |
| Primary on-call    | @name (PagerDuty rotation)   |
| Secondary on-call  | @name (witness + scribe)     |
| Incident commander | @name (if escalated)         |

---

## Scenario Library

### S-001: Replay Guard Redis Failure

Simulate Redis unavailability during peak traffic. Validate:

- Fallback to in-memory nonce store
- No replay nonce reuse
- Alert fires within 60 seconds
- Auto-recovery when Redis returns

### S-002: Compliance Gateway Auth Partition

Simulate network partition between compliance gateway and identity provider. Validate:

- Unauthenticated requests rejected with 401
- Authenticated sessions continue (local JWT validation)
- No false positives in audit log

### S-003: WORM Storage Access Attempt

Attempt unauthorized deletion of audit events from WORM bucket. Validate:

- S3 Object Lock denies delete
- CloudTrail logs the attempt
- Security alert fires within 5 minutes

### S-004: Terraform State Corruption

Inject a malformed Terraform state and attempt `terraform plan`. Validate:

- CI gate blocks merge
- State backup is restorable from S3 versioning
- DR runbook executes cleanly

### S-005: Anomaly Detection False Positive

Inject synthetic anomaly metrics and verify:

- Detector fires within polling window
- Dry-run mode does not page
- Alert is routed to correct team
- Post-alert review is scheduled

---

## Execution Checklist

### Pre-Drill (T-30 min)

- [ ] Notify #incident-response channel: "Scheduled drill starting in 30 min"
- [ ] Verify PagerDuty rotation is current
- [ ] Confirm secondary on-call is available
- [ ] Check monitoring dashboards are reachable
- [ ] Review runbook for selected scenario

### During Drill

- [ ] Inject fault (see scenario-specific commands)
- [ ] Primary on-call acknowledges page within SLA (5 min for P1)
- [ ] Secondary on-call joins bridge within 10 min
- [ ] Runbook steps are followed in sequence
- [ ] Every action is narrated in real-time
- [ ] Evidence (screenshots, logs, metrics) is captured
- [ ] Fault is removed / service restored
- [ ] Post-incident review scheduled within 48 hours

### Post-Drill (within 24 hours)

- [ ] Blameless post-mortem document created
- [ ] Timeline reconstructed from PagerDuty + logs
- [ ] Action items filed with owners and due dates
- [ ] Runbook updated if gaps found
- [ ] Evidence package uploaded to compliance bucket
- [ ] Drill completion logged in score-evidence ledger

---

## Evidence Collection

### Required Artifacts

| Artifact                | Source                   | Filename pattern              |
| ----------------------- | ------------------------ | ----------------------------- |
| PagerDuty incident PDF  | PagerDuty export         | `drill-{id}-pagerduty.pdf`    |
| Timeline screenshot     | Slack #incident-response | `drill-{id}-timeline.png`     |
| Metrics dashboard       | Grafana snapshot         | `drill-{id}-grafana.json`     |
| Log excerpts            | Loki / CloudWatch        | `drill-{id}-logs.txt`         |
| Runbook execution trace | Scribed by secondary     | `drill-{id}-runbook-trace.md` |
| Post-mortem document    | Google Docs / Notion     | `drill-{id}-postmortem.md`    |

### Upload Destination

```bash
aws s3 sync ./drill-evidence/ \
  s3://gtcx-compliance-evidence/on-call-drills/YYYY/MM/ \
  --storage-class GLACIER \
  --metadata retention=7years,classification=internal
```

---

## Scoring Rubric

| Criterion                            | Pass | Fail | N/A |
| ------------------------------------ | ---- | ---- | --- |
| Page acknowledged within SLA         |      |      |     |
| Runbook followed without deviation   |      |      |     |
| Service restored within RTO target   |      |      |     |
| No data loss or corruption           |      |      |     |
| Evidence complete and uploaded       |      |      |     |
| Post-mortem within 48 hours          |      |      |     |
| Action items have owners + deadlines |      |      |     |
| Runbook updated if gaps found        |      |      |     |

**Pass threshold:** 7/8 criteria (all except N/A)  
**Re-drill required if:** Any "Fail" on data-loss, SLA, or RTO

---

## Regulatory Traceability

| Control           | SOC 2        | ISO 27001 | NIST 800-53 |
| ----------------- | ------------ | --------- | ----------- |
| Incident response | CC7.3, CC7.4 | A.16.1    | IR-4, IR-8  |
| Availability      | A1.2         | A.17.1    | CP-2, CP-4  |
| Monitoring        | CC7.2        | A.12.4    | AU-6, AU-7  |

---

## Audit Trail

| Version | Date       | Author | Change                        |
| ------- | ---------- | ------ | ----------------------------- |
| 1.0     | 2026-05-12 | SRE    | Initial template from roadmap |
