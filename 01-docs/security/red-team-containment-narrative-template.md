---
title: 'Red Team Containment Narrative Template'
status: 'current'
date: '2026-05-27'
owner: 'infrastructure-security-team'
role: 'infrastructure-security-team'
tier: 'critical'
tags: ['security', 'compliance', 'operations']
review_cycle: 'per-exercise'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Red Team Containment Narrative Template

**Classification:** Confidential  
**Version:** 1.0

---

## Purpose

This template produces a containment narrative for every red team exercise. The narrative documents how the blue team detected, contained, eradicated, and recovered from the simulated attack. It is the primary evidence artifact for the M3/M4 exit criterion **"Red team exercise completed with containment narrative."**

---

## Exercise Metadata

| Field                         | Value                                      |
| ----------------------------- | ------------------------------------------ |
| Exercise ID                   | `RT-{YYYY}-{NNN}`                          |
| Scenario                      | {e.g., Compromised developer credentials}  |
| Date Range                    | {YYYY-MM-DD to YYYY-MM-DD}                 |
| Red Team Lead                 | {name}                                     |
| Blue Team Lead                | {name}                                     |
| Assumed Breach Starting Point | {e.g., valid GitHub PAT + AWS SSO session} |
| Scope                         | {in-scope systems}                         |
| Exclusions                    | {out-of-scope systems}                     |

---

## 1. Detection Timeline

| Time (UTC) | Event                   | Detection Source                | Alert Fired? |
| ---------- | ----------------------- | ------------------------------- | ------------ |
| T+0m       | {Red team action}       | {Log source}                    | Yes / No     |
| T+{X}m     | {Blue team observation} | {SIEM / Prometheus / PagerDuty} | Yes / No     |

**Time to Detect (TTD):** {X} minutes  
**Detection Quality:** {Immediate / Delayed / Missed entirely}

---

## 2. Triage & Classification

**Initial Triage Lead:** {on-call engineer}  
**Classification:** {True Positive / False Positive — confirmed red team}  
**Severity Assigned:** {P1 / P2 / P3}  
**Incident Channel:** {PagerDuty / Slack / War room}

**Triage Decision Tree Applied:**

1. Is the activity anomalous? {Yes / No — rationale}
2. Is the anomalous activity malicious? {Yes / No — rationale}
3. Is the malicious activity contained to a single workload? {Yes / No — rationale}
4. Does the activity require immediate rollback or isolation? {Yes / No — rationale}

---

## 3. Containment Actions

### 3.1 Immediate Containment (First 15 minutes)

| Action                                         | Owner   | Time   | Result                       |
| ---------------------------------------------- | ------- | ------ | ---------------------------- |
| {e.g., Revoke compromised GitHub PAT}          | {owner} | T+{X}m | {Success / Partial / Failed} |
| {e.g., Rotate AWS SSO session}                 | {owner} | T+{X}m | {Success / Partial / Failed} |
| {e.g., Isolate affected pod via NetworkPolicy} | {owner} | T+{X}m | {Success / Partial / Failed} |
| {e.g., Scale anomalous deployment to 0}        | {owner} | T+{X}m | {Success / Partial / Failed} |

**Time to Contain (TTC):** {X} minutes

### 3.2 Short-Term Containment (15 minutes — 4 hours)

| Action                                        | Owner   | Time   | Result                       |
| --------------------------------------------- | ------- | ------ | ---------------------------- |
| {e.g., Enable WAF rate-limiting rule}         | {owner} | T+{X}m | {Success / Partial / Failed} |
| {e.g., Restore from last known-good backup}   | {owner} | T+{X}m | {Success / Partial / Failed} |
| {e.g., Rotate database credentials via Vault} | {owner} | T+{X}m | {Success / Partial / Failed} |

### 3.3 Long-Term Hardening (4 hours — 2 weeks)

| Action                                                       | Owner   | Target Date | Status                      |
| ------------------------------------------------------------ | ------- | ----------- | --------------------------- |
| {e.g., Enforce MFA on all GitHub org members}                | {owner} | {date}      | {Open / In Progress / Done} |
| {e.g., Add anomaly detector rule for off-hours admin access} | {owner} | {date}      | {Open / In Progress / Done} |
| {e.g., Rotate all long-lived secrets}                        | {owner} | {date}      | {Open / In Progress / Done} |

---

## 4. Eradication

**Confirmed Attack Artifacts:**

| Artifact                          | Location         | Eradication Method                  | Verified Clean? |
| --------------------------------- | ---------------- | ----------------------------------- | --------------- |
| {e.g., Malicious container image} | {ECR repo}:{tag} | Deleted + lifecycle policy enforced | Yes / No        |
| {e.g., Modified Terraform state}  | {S3 bucket}      | Restored from WORM audit trail      | Yes / No        |
| {e.g., Backdoor IAM policy}       | {IAM role}       | Removed + SCP enforced              | Yes / No        |

**Evidence Preservation:**

- CloudWatch logs retained: {log group} → {retention period}
- Kyverno audit events: {policy violations exported}
- Snapshot of affected volumes: {EBS snapshot ID}

---

## 5. Recovery

**Systems Affected:**

| System               | Impact                        | Recovery Method       | RTO Achieved? |
| -------------------- | ----------------------------- | --------------------- | ------------- |
| {e.g., gtcx-agx API} | {Degraded / Down / Data loss} | {Rollback to vX.Y.Z}  | Yes / No      |
| {e.g., Vault}        | {Sealed / Unsealed}           | {Auto-unseal via KMS} | Yes / No      |

**Business Continuity Verified:**

- [ ] Core trading API operational
- [ ] Compliance gateway accepting requests
- [ ] Replay guard enforcing non-replay
- [ ] Audit log chain unbroken (hash verification)
- [ ] DR failover tested (if applicable)

---

## 6. Containment Effectiveness Scorecard

| Metric                  | Target               | Actual  | Grade           |
| ----------------------- | -------------------- | ------- | --------------- |
| Time to Detect (TTD)    | ≤5 min               | {X} min | {A / B / C / F} |
| Time to Contain (TTC)   | ≤15 min              | {X} min | {A / B / C / F} |
| Time to Eradicate (TTE) | ≤1 hour              | {X} min | {A / B / C / F} |
| Time to Recover (TTR)   | ≤4 hours             | {X} min | {A / B / C / F} |
| False Positive Rate     | ≤5%                  | {X}%    | {A / B / C / F} |
| Alert Coverage          | 100% of attack steps | {X}%    | {A / B / C / F} |

**Overall Containment Grade:** {A / B / C / F}

---

## 7. Lessons Learned

### What Worked

1. {Specific control or process that detected or contained the attack}
2. {Team coordination or tooling that accelerated response}

### What Did Not Work

1. {Gap in detection, containment, or recovery}
2. {Process friction or tooling limitation}

### Recommended Improvements

| Priority | Improvement                                                     | Owner   | Target Date |
| -------- | --------------------------------------------------------------- | ------- | ----------- |
| P1       | {e.g., Add anomaly detector rule for credential-revocation gap} | {owner} | {date}      |
| P2       | {e.g., Reduce TTD by 50% via new CloudWatch alarm}              | {owner} | {date}      |
| P3       | {e.g., Automate containment response for known attack patterns} | {owner} | {date}      |

---

## 8. Evidence Attachments

- [ ] PagerDuty incident timeline export
- [ ] CloudWatch Logs Insights query results
- [ ] Prometheus alert snapshot
- [ ] Kyverno policy violation report
- [ ] Terraform plan diff (if infrastructure modified)
- [ ] Rollback evidence bundle (`generate-release-evidence.mjs` output)
- [ ] Board briefing (link to `01-docs/09-security/red-team-playbook.md` template)

---

## Sign-off

| Role             | Name | Date | Signature |
| ---------------- | ---- | ---- | --------- |
| Red Team Lead    |      |      |           |
| Blue Team Lead   |      |      |           |
| CISO             |      |      |           |
| Engineering Lead |      |      |           |
