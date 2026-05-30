---
title: 'Break-Glass Emergency Access Procedure'
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

# Break-Glass Emergency Access Procedure

**Classification:** Internal — Restricted  
**Owner:** CISO  
**Effective date:** 2026-05-08  
**Review cycle:** Quarterly  
**Regulatory alignment:** SOC 2 Type II (CC6.1, CC6.6, CC7.3), ISO 27001 A.16.1, NIST 800-53 AC-2(2), IR-4

---

## 1. Purpose

This procedure defines the controlled escalation path for emergency access to production systems when normal access controls are insufficient to resolve a **Severity P1** incident. Break-glass access bypasses standard approval workflows and grants temporary elevated privileges.

Every break-glass invocation is a security event. It is logged, alerted, and reviewed.

---

## 2. When to Invoke

Break-glass access is authorized **only** when ALL of the following conditions are true:

| Condition                     | Detail                                                              |
| ----------------------------- | ------------------------------------------------------------------- |
| Severity is P1                | Production is down, data is at risk, or a security breach is active |
| Normal access is insufficient | The responder's standing permissions cannot resolve the incident    |
| Delay causes material harm    | Waiting for standard approval would extend the outage or exposure   |
| An incident ticket exists     | A PagerDuty or incident management ticket is open and referenced    |

Break-glass is **never** authorized for:

- Routine maintenance or deployments
- Debugging non-production environments
- Convenience or speed on non-critical tasks
- Incidents below P1 severity

---

## 3. Authorized Responders

| Role                  | Break-glass authorization              |
| --------------------- | -------------------------------------- |
| CISO                  | Approve (can also perform in extremis) |
| Security Engineer     | Perform                                |
| Platform Engineer     | Perform                                |
| Application Developer | Not authorized                         |
| Auditor (External)    | Not authorized                         |
| Board Observer        | Not authorized                         |

A minimum of **two authorized responders** must be involved: one to perform, one to witness and log.

---

## 4. Session Constraints

| Parameter                | Value                                              |
| ------------------------ | -------------------------------------------------- |
| Maximum session duration | **15 minutes**                                     |
| Credential type          | Temporary STS token (AWS) or short-lived K8s token |
| Credential expiry        | Automatic at session end; non-renewable            |
| Scope                    | Minimum necessary to resolve the specific incident |
| Extensions               | Requires fresh CISO approval; new 15-minute window |

---

## 5. Invocation Procedure

### Step 1: Declare break-glass

The incident commander declares break-glass in the incident channel and references the PagerDuty incident ID.

```
BREAK-GLASS INVOKED
Incident: PD-XXXXXXXX
Responder: [name]
Witness: [name]
Reason: [one-line description]
Time: [UTC timestamp]
```

### Step 2: Auto-alert fires

The break-glass credential vault triggers an automatic PagerDuty alert to:

- CISO (P1 escalation)
- Security Engineer on-call
- Platform Engineer on-call

This alert fires **on every use** with no suppression or deduplication.

### Step 3: Retrieve temporary credentials

```bash
# AWS break-glass — 15 minute STS session
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/gtcx-break-glass \
  --role-session-name "breakglass-PD-XXXXXXXX-$(whoami)" \
  --duration-seconds 900

# K8s break-glass — 15 minute token
kubectl create token break-glass-sa \
  --namespace kube-system \
  --duration 900s
```

### Step 4: Perform remediation

- Execute only the actions necessary to resolve the P1 incident.
- Narrate every action in the incident channel in real-time.
- The witness confirms each action is within scope.

### Step 5: Terminate session

- Explicitly revoke credentials even if the 15-minute window has not elapsed.
- Confirm revocation in the incident channel.

```bash
# Revoke AWS session (if needed before auto-expiry)
aws iam update-assume-role-policy --role-name gtcx-break-glass \
  --policy-document file://deny-all.json

# Delete K8s token binding
kubectl delete clusterrolebinding break-glass-binding
```

### Step 6: Log completion

```
BREAK-GLASS TERMINATED
Incident: PD-XXXXXXXX
Duration: [X] minutes
Actions taken: [summary]
Credentials revoked: YES
```

---

## 6. Evidence Requirements

Every break-glass event must produce the following evidence within 24 hours:

| Evidence item               | Source                                            | Retention |
| --------------------------- | ------------------------------------------------- | --------- |
| Who invoked                 | PagerDuty alert + incident channel log            | 7 years   |
| When (UTC start/end)        | CloudTrail `AssumeRole` event + credential expiry | 7 years   |
| Why (justification)         | Incident ticket with P1 classification            | 7 years   |
| What actions taken          | CloudTrail API log + kubectl audit log            | 7 years   |
| Witness confirmation        | Incident channel transcript                       | 7 years   |
| Credential revocation proof | CloudTrail or K8s audit event                     | 7 years   |

---

## 7. Audit Trail Sources

| System                        | Log type           | What it captures                                                |
| ----------------------------- | ------------------ | --------------------------------------------------------------- |
| AWS CloudTrail                | Management events  | `AssumeRole`, all API calls made under the break-glass session  |
| Kubernetes audit log          | RequestResponse    | All kubectl commands, resource mutations, authentication events |
| PagerDuty                     | Incident timeline  | Alert trigger, acknowledgment, escalations, resolution          |
| Slack / incident channel      | Message history    | Real-time narration of actions, witness confirmations           |
| Audit database (`gtcx_audit`) | Append-only record | Structured break-glass event record inserted by automation      |

All logs are forwarded to the centralized SIEM within 60 seconds. Log tampering triggers an independent alert.

---

## 8. Post-Incident Review

| Requirement | Detail                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| Deadline    | **48 hours** after break-glass termination                                |
| Attendees   | CISO, incident responder, witness, Security Engineer on-call              |
| Format      | Blameless post-incident review (see `docs/security/incident-response.md`) |
| Output      | Written report filed as a compliance artifact                             |

### Review checklist

- [ ] Was break-glass invocation justified (P1 confirmed)?
- [ ] Were session constraints honored (15 min, minimum scope)?
- [ ] Were all actions narrated and witnessed in real-time?
- [ ] Were credentials revoked immediately after resolution?
- [ ] Is all evidence collected and stored per retention policy?
- [ ] Are there systemic fixes to prevent future break-glass for this class of incident?
- [ ] Should standing access be adjusted to avoid future break-glass needs?

---

## 9. Credential Auto-Expiry Configuration

### AWS IAM Role Trust Policy

The break-glass role enforces maximum session duration at the IAM level:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "NumericLessThanEquals": {
          "aws:MaxSessionDuration": "900"
        },
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    }
  ]
}
```

### Kubernetes RBAC

The break-glass `ClusterRoleBinding` uses a TTL annotation processed by the JIT access controller:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: break-glass-binding
  annotations:
    gtcx.io/ttl: '900'
    gtcx.io/incident-id: 'PD-XXXXXXXX'
    gtcx.io/requester: 'responder@gtcx.io'
subjects:
  - kind: User
    name: responder@gtcx.io
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

---

## 10. Violations

Any of the following constitute a break-glass policy violation:

| Violation                                        | Consequence                                          |
| ------------------------------------------------ | ---------------------------------------------------- |
| Invocation for non-P1 incident                   | Immediate access revocation + formal investigation   |
| Session exceeding 15 minutes without re-approval | Security finding + mandatory retraining              |
| Actions outside incident scope                   | Formal investigation + potential disciplinary action |
| Failure to narrate actions in real-time          | Security finding                                     |
| Missing post-incident review at 48 hours         | Escalation to CISO + compliance exception filed      |
| Credential not revoked after session             | Critical security finding + immediate remediation    |

---

## 11. Regulatory Traceability

| Control           | SOC 2        | ISO 27001 | NIST 800-53 |
| ----------------- | ------------ | --------- | ----------- |
| Emergency access  | CC6.1, CC6.6 | A.9.2.3   | AC-2(2)     |
| Incident response | CC7.3        | A.16.1.5  | IR-4        |
| Audit logging     | CC7.2        | A.12.4.1  | AU-2, AU-3  |
| Access revocation | CC6.3        | A.9.2.6   | AC-2(3)     |
