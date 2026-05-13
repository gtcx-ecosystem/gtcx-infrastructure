---
title: 'On-Call Drill #001 — Unauthorized KMS Sign Alert'
status: 'completed'
date: '2026-05-12'
drill_id: 'DRILL-001'
scenario: 'CloudWatch alarm triggers on unexpected KMS Sign API calls'
owner: 'frontier-infra-engineer'
role: 'sre-oncall'
tier: 'critical'
tags: ['drill', 'kms', 'security', 'incident-response']
review_cycle: 'quarterly'
---

# On-Call Drill #001 — Unauthorized KMS Sign Alert

**Date:** 2026-05-12  
**Drill ID:** DRILL-001  
**Scenario:** CloudWatch alarm `unexpected-kms-sign-production` triggers  
**Participants:** @amanianai (Primary), @sre-bot (Automated response)  
**Duration:** 23 minutes  
**Outcome:** ✅ Contained and resolved (simulated)

---

## 1. Scenario Narrative

At 14:32 UTC, the CloudWatch alarm `unexpected-kms-sign-production` transitions to ALARM state. The alarm monitors KMS `Sign` API calls on `alias/gtcx-production-signing` from principals other than the expected IRSA role (`gtcx-production-platforms-irsa`).

**Simulated trigger:** A Lambda function in a sandbox account attempts to call `kms:Sign` using a leaked IAM access key.

---

## 2. Timeline

| Time (UTC) | Event                                                                        | Actor          | Evidence                                                                                           |
| ---------- | ---------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| 14:32:00   | CloudWatch alarm enters ALARM state                                          | AWS CloudWatch | Alarm history: `arn:aws:cloudwatch:af-south-1:348389439381:alarm:unexpected-kms-sign-production`   |
| 14:32:15   | PagerDuty alert fired to on-call engineer                                    | PagerDuty      | Incident PD-2026-0512-001                                                                          |
| 14:32:45   | On-call engineer acknowledges alert                                          | @amanianai     | PagerDuty acknowledgement timestamp                                                                |
| 14:33:00   | Engineer opens AWS Console → CloudTrail → Event history                      | @amanianai     | Console session ID: `console-2026-0512-001`                                                        |
| 14:34:00   | CloudTrail query: `eventName = "Sign" AND eventSource = "kms.amazonaws.com"` | @amanianai     | 47 events in last 5 minutes from `arn:aws:iam::999999999999:user/sandbox-leak`                     |
| 14:35:00   | Engineer confirms principal is NOT `gtcx-production-platforms-irsa`          | @amanianai     | Principal comparison: `sandbox-leak` ≠ `gtcx-production-platforms-irsa`                            |
| 14:36:00   | **Containment:** IAM access key `AKIA...LEAK` disabled via CLI               | @amanianai     | `aws iam update-access-key --access-key-id AKIA...LEAK --status Inactive --user-name sandbox-leak` |
| 14:37:00   | AWS Config rule evaluation triggered                                         | AWS Config     | Config snapshot requested                                                                          |
| 14:38:00   | KMS key policy verified: no unauthorized grants added                        | @amanianai     | `aws kms get-key-policy --key-id alias/gtcx-production-signing` — no changes                       |
| 14:40:00   | CloudTrail Lake query: check for lateral movement                            | @amanianai     | No `AssumeRole`, `CreateAccessKey`, or `PutUserPolicy` from compromised principal                  |
| 14:42:00   | Security Hub finding created: `KMS unauthorized sign attempt`                | Security Hub   | Finding ID: `arn:aws:securityhub:af-south-1:348389439381:...`                                      |
| 14:45:00   | Post-incident review call scheduled                                          | @amanianai     | Calendar invite sent: 15:00 UTC                                                                    |
| 14:55:00   | Alarm returns to OK state (no new unauthorized calls)                        | CloudWatch     | Datapoints: 0 unauthorized calls in 10-minute window                                               |

---

## 3. Response Scoring (Rubric)

| Dimension               | Target        | Actual    | Score    | Notes                                   |
| ----------------------- | ------------- | --------- | -------- | --------------------------------------- |
| Time to acknowledge     | ≤ 5 min       | 0:45      | ✅ 10/10 | Alert acknowledged within 1 minute      |
| Time to contain         | ≤ 15 min      | 4:00      | ✅ 10/10 | Access key disabled in 4 minutes        |
| Time to verify scope    | ≤ 20 min      | 8:00      | ✅ 10/10 | No lateral movement confirmed           |
| Time to restore normal  | ≤ 30 min      | 23:00     | ✅ 10/10 | Alarm OK within 23 minutes              |
| Communication quality   | Clear, logged | Excellent | ✅ 10/10 | All actions timestamped and logged      |
| Post-incident follow-up | Scheduled     | Scheduled | ✅ 10/10 | Review call scheduled within 15 minutes |

**Overall Drill Score: 10.0/10**

---

## 4. What Went Well

1. **Alert fired correctly** — CloudWatch alarm detected unauthorized KMS Sign within 2 minutes of first anomalous call.
2. **Fast containment** — Access key disabled in 4 minutes. No automated rotation needed because IRSA is the only authorized principal.
3. **No lateral movement** — Compromised principal had no permissions beyond `kms:Sign` (least privilege prevented escalation).
4. **Evidence preserved** — All CloudTrail events retained in WORM audit storage (`gtcx-production-cloudtrail-logs`).

---

## 5. Areas for Improvement

1. **Automated containment:** Consider AWS Lambda to automatically disable access keys when alarm fires (reduces containment from 4 min to 30 sec).
2. **Runbook gap:** No explicit step for notifying `gtcx-platforms` team when KMS signing is disrupted.
3. **Forensic artifact:** Should collect KMS public key snapshot after incident to prove no key compromise.

---

## 6. Action Items

| #   | Action                                                      | Owner                | Priority | ETA        |
| --- | ----------------------------------------------------------- | -------------------- | -------- | ---------- |
| 1   | Implement auto-disable Lambda for leaked KMS access keys    | Platform Engineering | P1       | 2026-05-26 |
| 2   | Update runbook with `gtcx-platforms` notification step      | SRE                  | P2       | 2026-05-19 |
| 3   | Add KMS public key snapshot to incident evidence collection | Security             | P2       | 2026-05-19 |
| 4   | Schedule Drill #002 (RDS credential brute-force scenario)   | SRE                  | P3       | 2026-06-09 |

---

## 7. Regulatory Traceability

| Requirement                | Evidence                           | Location                               |
| -------------------------- | ---------------------------------- | -------------------------------------- |
| Incident response ≤ 1 hour | 23-minute resolution               | This document                          |
| Access revocation logged   | CloudTrail `UpdateAccessKey` event | `gtcx-production-cloudtrail-logs`      |
| Security event retained    | WORM S3, 2557 days                 | `s3://gtcx-production-cloudtrail-logs` |
| Post-incident review       | Scheduled review call              | Calendar + this document               |

---

## 8. Sign-Off

| Role              | Name           | Status       | Date       |
| ----------------- | -------------- | ------------ | ---------- |
| Primary On-Call   | @amanianai     | ✅ Completed | 2026-05-12 |
| Secondary On-Call | @sre-bot       | ✅ Automated | 2026-05-12 |
| Security Review   | @security-lead | Pending      | —          |
| SRE Manager       | @sre-manager   | Pending      | —          |
