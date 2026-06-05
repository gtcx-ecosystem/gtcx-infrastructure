# Just-in-Time (JIT) Access Policy

**Classification:** Internal — Restricted  
**Owner:** CISO  
**Effective date:** 2026-05-08  
**Review cycle:** Quarterly  
**Regulatory alignment:** SOC 2 Type II (CC6.1, CC6.3), ISO 27001 A.9.2.2, NIST 800-53 AC-2(6), AC-6(1)

---

## 1. Principle

No engineer holds standing elevated access to production systems. All privileged access is granted just-in-time, scoped to a specific task, and automatically revoked after a defined duration. This eliminates persistent administrative credentials and reduces the blast radius of credential compromise.

---

## 2. Scope

This policy applies to:

- AWS IAM roles with write or admin permissions in production accounts
- Kubernetes RBAC roles above `view` in production namespaces
- Database access beyond application service accounts
- Secret management systems (AWS Secrets Manager, Vault)
- CI/CD pipeline administrative actions

This policy does **not** apply to:

- Read-only access to non-production environments (covered by baseline RBAC)
- Application service account credentials (managed by workload identity)
- Break-glass access (covered by `01-docs/09-security/break-glass-procedure.md`)

---

## 3. AWS IAM Identity Center Configuration

### Session parameters

| Parameter                | Value                                               |
| ------------------------ | --------------------------------------------------- |
| Identity provider        | AWS IAM Identity Center (SSO)                       |
| Maximum session duration | **4 hours**                                         |
| Default session duration | **1 hour**                                          |
| MFA requirement          | Required for every session (hardware key preferred) |
| Session refresh          | Not permitted; new request required                 |
| Idle timeout             | 30 minutes of inactivity                            |

### Permission sets

| Permission set       | Scope              | Use case                                |
| -------------------- | ------------------ | --------------------------------------- |
| `GTCX-ReadOnly`      | All accounts       | Log review, dashboards, troubleshooting |
| `GTCX-Deploy`        | Production account | Pipeline-triggered deployments          |
| `GTCX-DatabaseAdmin` | Production account | Schema migrations, performance tuning   |
| `GTCX-SecurityOps`   | All accounts       | Security incident investigation         |
| `GTCX-InfraAdmin`    | Production account | Terraform apply, resource provisioning  |

All permission sets enforce:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "NumericGreaterThan": {
          "aws:MaxSessionDuration": "14400"
        }
      }
    }
  ]
}
```

---

## 4. Kubernetes RBAC Temporary Role Bindings

### kubectl-access tool

All JIT K8s access is provisioned through the `kubectl-access` CLI tool, which creates temporary `RoleBinding` or `ClusterRoleBinding` resources with a TTL annotation.

```bash
# Request 2-hour edit access to the payments namespace
kubectl-access request \
  --namespace payments \
  --role edit \
  --duration 2h \
  --reason "JIRA-1234: investigate payment processing latency" \
  --approver security-team
```

### Binding lifecycle

| Phase        | Action                                                                    |
| ------------ | ------------------------------------------------------------------------- |
| Request      | Engineer submits via `kubectl-access request` with reason and duration    |
| Approval     | Peer engineer + Security team member approve in Slack or ticketing system |
| Provisioning | Controller creates `RoleBinding` with TTL annotation                      |
| Active       | Engineer has scoped access for the approved duration                      |
| Expiry       | Controller deletes the `RoleBinding` automatically at TTL                 |
| Audit        | Event logged to K8s audit log and `gtcx_audit` database                   |

### Example temporary RoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: jit-alice-payments-edit-20260508T1400Z
  namespace: payments
  annotations:
    gtcx.trade/jit: 'true'
    gtcx.trade/ttl: '7200'
    gtcx.trade/expires-at: '2026-05-08T16:00:00Z'
    gtcx.trade/requester: 'alice@gtcx.trade'
    gtcx.trade/approver: 'bob@gtcx.trade,security-oncall@gtcx.trade'
    gtcx.trade/reason: 'JIRA-1234: investigate payment processing latency'
    gtcx.trade/ticket: 'JIRA-1234'
subjects:
  - kind: User
    name: alice@gtcx.trade
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

---

## 5. Auto-Expiry Enforcement

All JIT grants use automatic expiry. Manual revocation is a secondary control, not the primary mechanism.

| System                  | Expiry mechanism                                                                  | Fallback                                           |
| ----------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| AWS IAM Identity Center | STS token `DurationSeconds`                                                       | CloudWatch alarm on sessions exceeding 4 hours     |
| Kubernetes              | JIT controller watches TTL annotations, deletes expired bindings every 60 seconds | CronJob sweep every 5 minutes as secondary cleanup |
| Secrets Manager         | Temporary policy attachment with `Condition.DateLessThan`                         | Lambda function revokes stale grants hourly        |
| Database                | pg_hba temporary entry + connection timeout                                       | Connection pooler enforces max session lifetime    |

---

## 6. Approval Workflow

Every JIT request requires two approvals before provisioning:

### Approval chain

| Approver                 | Role                                               | SLA        |
| ------------------------ | -------------------------------------------------- | ---------- |
| **Peer engineer**        | Same team, familiar with the system being accessed | 15 minutes |
| **Security team member** | Security Engineer or CISO                          | 30 minutes |

### Approval criteria

The approver verifies:

1. **Justification is specific.** "I need access" is rejected. A ticket reference and description of the task are required.
2. **Duration is proportional.** A 4-hour request for a 10-minute task is rejected.
3. **Scope is minimal.** Requesting `cluster-admin` when `edit` on one namespace suffices is rejected.
4. **Requester is authorized.** Only roles listed in the SoD matrix may request the corresponding access level.

### Escalation

If both approvers are unavailable within 30 minutes and the task is urgent (but not P1), the CISO may approve unilaterally. This is logged as an exception.

---

## 7. Logging and Audit

Every JIT session produces the following log entries:

| Event                   | Destination                     | Fields                                           |
| ----------------------- | ------------------------------- | ------------------------------------------------ |
| Access requested        | Audit DB (`gtcx_audit`)         | requester, role, scope, duration, reason, ticket |
| Access approved         | Audit DB + Slack notification   | approver(s), approval timestamp                  |
| Access provisioned      | CloudTrail + K8s audit log      | credential/binding created, expiry time          |
| Actions performed       | CloudTrail + K8s audit log      | All API calls made during the session            |
| Access expired          | Audit DB + CloudTrail/K8s audit | Credential/binding deleted, actual duration      |
| Access manually revoked | Audit DB + alert                | Revoker, reason for early revocation             |

### Log retention

| Log source             | Retention period                 |
| ---------------------- | -------------------------------- |
| `gtcx_audit` database  | 7 years (append-only, immutable) |
| AWS CloudTrail         | 7 years (S3 with Object Lock)    |
| Kubernetes audit log   | 2 years (forwarded to SIEM)      |
| Slack approval threads | 1 year                           |

---

## 8. Prohibited Patterns

| Pattern                                             | Status         | Rationale                                        |
| --------------------------------------------------- | -------------- | ------------------------------------------------ |
| Standing admin access to production                 | **Prohibited** | Violates least privilege; increases blast radius |
| Shared credentials or service account impersonation | **Prohibited** | Destroys attribution; audit trail is meaningless |
| Self-approval of JIT requests                       | **Prohibited** | Violates separation of duties                    |
| JIT duration exceeding 4 hours                      | **Prohibited** | Request must be split into multiple sessions     |
| JIT request without a ticket reference              | **Prohibited** | All access must be traceable to a work item      |
| Renewing an expired session without fresh approval  | **Prohibited** | Each session is independently approved           |

---

## 9. Monitoring and Alerting

| Alert                                       | Trigger                                | Destination                    |
| ------------------------------------------- | -------------------------------------- | ------------------------------ |
| JIT session approaching expiry              | 5 minutes before TTL                   | Slack DM to requester          |
| JIT session expired with active connections | Binding deleted while connections open | Security on-call PagerDuty     |
| Unusual JIT request volume                  | >3 requests from same user in 24 hours | Security on-call Slack         |
| JIT request for sensitive namespace         | `kube-system`, `payments`, `audit`     | CISO notification              |
| Approval SLA breach                         | No approval within 30 minutes          | Security team Slack escalation |

---

## 10. Regulatory Traceability

| Control                   | SOC 2 | ISO 27001 | NIST 800-53 |
| ------------------------- | ----- | --------- | ----------- |
| Just-in-time provisioning | CC6.1 | A.9.2.2   | AC-2(6)     |
| Least privilege           | CC6.3 | A.9.2.3   | AC-6(1)     |
| Access review and expiry  | CC6.2 | A.9.2.5   | AC-2(3)     |
| Audit logging of access   | CC7.2 | A.12.4.1  | AU-2, AU-3  |
| Approval workflow         | CC6.1 | A.9.2.1   | AC-2(1)     |
