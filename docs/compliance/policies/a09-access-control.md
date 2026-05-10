# POL-09: Access Control

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Annex A Reference:** A.9 — Access Control
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO
**Approved By:** Board Security Committee

## 1. Purpose

Ensure that access to information systems is authorized, appropriate, and regularly reviewed.

## 2. Scope

All GTCX systems, applications, databases, cloud services, repositories, and infrastructure components.

## 3. Policy Statement

1. **Least privilege.** Access is granted on a need-to-know, need-to-use basis. Default deny. Every access grant must reference a business justification. Privileged access (admin, root, production write) requires additional approval from the system owner and CISO.

2. **User access management.** Access provisioning follows a formal request-approve-provision workflow. Access is reviewed quarterly by system owners. Stale accounts (no login for 90 days) are automatically disabled. Terminated accounts are revoked within 4 hours.

3. **Authentication.** All systems require multi-factor authentication (MFA). Service accounts use short-lived tokens (maximum 1 hour) or certificate-based authentication. Passwords must meet: 16+ characters, no reuse of last 12 passwords, no dictionary words. SSO is mandatory where supported.

4. **Privileged access.** Privileged accounts are separate from daily-use accounts. Privileged sessions are logged and monitored. Just-in-time (JIT) access is preferred over standing privileges. Emergency access (break-glass) procedures are documented and audited.

5. **API and programmatic access.** API keys and tokens are rotated every 90 days. Secrets are stored in a secrets manager (never in code, config files, or environment files committed to version control). Access to secrets manager is itself governed by MFA and least privilege.

## 4. Responsibilities

| Role          | Responsibility                                                 |
| ------------- | -------------------------------------------------------------- |
| CISO          | Define access policy, approve privileged access                |
| System Owners | Conduct quarterly access reviews, approve standard access      |
| DevOps        | Implement technical controls, automate token rotation          |
| All Personnel | Use unique credentials, enable MFA, report unauthorized access |

## 5. Exceptions

Standing privileged access exceptions require CISO approval, documented compensating controls, and quarterly re-approval (maximum 12 months total).

## 6. Review

Reviewed annually. Access reviews conducted quarterly.
