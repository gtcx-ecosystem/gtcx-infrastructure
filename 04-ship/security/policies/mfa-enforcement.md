# MFA Enforcement Policy

**Classification:** Internal — Restricted  
**Owner:** CISO  
**Effective date:** 2026-05-08  
**Review cycle:** Quarterly  
**Regulatory alignment:** SOC 2 Type II (CC6.1, CC6.6), ISO 27001 A.9.4.2, NIST 800-53 IA-2(1), IA-2(2), FFIEC Authentication, PCI-DSS 8.3

---

## 1. Principle

Multi-factor authentication is mandatory for every human identity accessing any GTCX system. There are no exceptions, no grace periods, and no fallback to single-factor authentication. MFA is enforced at the identity provider, the cloud provider, the source control platform, and the network perimeter.

---

## 2. Scope

| System                           | MFA required | Enforcement point                               |
| -------------------------------- | ------------ | ----------------------------------------------- |
| AWS Console and CLI              | Yes          | IAM Identity Center + IAM policy (deny non-MFA) |
| GitHub Organization              | Yes          | Organization security settings (SAML SSO + MFA) |
| Kubernetes API                   | Yes          | OIDC provider (MFA claim required)              |
| VPN (WireGuard / corporate)      | Yes          | VPN gateway OIDC authentication                 |
| CI/CD pipelines (human triggers) | Yes          | GitHub Actions OIDC + branch protection         |
| Database clients (direct access) | Yes          | Bastion host requires MFA before tunnel         |
| Internal admin dashboards        | Yes          | SSO with MFA claim                              |

Service accounts and workload identities authenticate via OIDC federation or IAM roles for service accounts (IRSA) — they do not use MFA. See Section 10 for service account controls.

---

## 3. Accepted MFA Methods

Listed in order of preference (strongest first):

| Method                                           | Tier   | Accepted            | Notes                                        |
| ------------------------------------------------ | ------ | ------------------- | -------------------------------------------- |
| Hardware security key (YubiKey 5, etc.)          | Tier 1 | Yes — **preferred** | FIDO2/WebAuthn; phishing-resistant           |
| Platform authenticator (Touch ID, Windows Hello) | Tier 1 | Yes                 | FIDO2/WebAuthn; device-bound                 |
| TOTP authenticator app (Authy, 1Password)        | Tier 2 | Yes                 | Acceptable where hardware key is impractical |
| SMS OTP                                          | Tier 3 | **No**              | Vulnerable to SIM swap; prohibited           |
| Email OTP                                        | Tier 3 | **No**              | Insufficient assurance; prohibited           |

### Hardware key requirements by role

| Role                  | Minimum MFA                       | Requirement                                  |
| --------------------- | --------------------------------- | -------------------------------------------- |
| CISO                  | Hardware key (FIDO2)              | 2x YubiKey 5 — mandatory                     |
| Security Engineer     | Hardware key (FIDO2)              | 2x YubiKey 5 — mandatory                     |
| Platform Engineer     | Hardware key (FIDO2)              | 2x YubiKey 5 — mandatory                     |
| Application Developer | Hardware key or authenticator app | YubiKey 5 recommended                        |
| External Auditor      | Authenticator app                 | Hardware key if accessing sensitive evidence |

Every engineer with production access is issued **two** hardware keys (primary + backup). Both must be registered before production access is provisioned. The backup key must be stored in a secure location separate from the primary.

---

## 4. AWS IAM Policy — Deny Non-MFA API Calls

This policy is attached to all IAM users and federated roles (except service accounts). It denies all actions except MFA self-management when the request is not authenticated with MFA.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowViewAccountInfo",
      "Effect": "Allow",
      "Action": ["iam:GetAccountPasswordPolicy", "iam:ListVirtualMFADevices"],
      "Resource": "*"
    },
    {
      "Sid": "AllowManageOwnMFA",
      "Effect": "Allow",
      "Action": [
        "iam:CreateVirtualMFADevice",
        "iam:DeleteVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:ListMFADevices",
        "iam:ResyncMFADevice",
        "iam:DeactivateMFADevice"
      ],
      "Resource": ["arn:aws:iam::*:mfa/${aws:username}", "arn:aws:iam::*:user/${aws:username}"]
    },
    {
      "Sid": "DenyAllExceptMFAManagementWithoutMFA",
      "Effect": "Deny",
      "NotAction": [
        "iam:CreateVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:GetUser",
        "iam:GetAccountPasswordPolicy",
        "iam:ListMFADevices",
        "iam:ListVirtualMFADevices",
        "iam:ResyncMFADevice",
        "sts:GetSessionToken"
      ],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    },
    {
      "Sid": "DenyDestructiveActionsWithoutRecentMFA",
      "Effect": "Deny",
      "Action": [
        "iam:*",
        "kms:*",
        "sts:AssumeRole",
        "s3:DeleteBucket",
        "s3:DeleteObject",
        "ec2:TerminateInstances",
        "rds:DeleteDBInstance",
        "rds:DeleteDBCluster",
        "rds:ModifyDBInstance",
        "secretsmanager:DeleteSecret",
        "secretsmanager:PutSecretValue",
        "cloudtrail:StopLogging",
        "cloudtrail:DeleteTrail"
      ],
      "Resource": "*",
      "Condition": {
        "NumericGreaterThan": {
          "aws:MultiFactorAuthAge": "14400"
        }
      }
    }
  ]
}
```

### Policy behavior

| Scenario                             | Result                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| API call with valid MFA token        | Allowed (subject to other policies)                           |
| API call without MFA                 | Denied for all actions except MFA self-management             |
| API call with MFA older than 4 hours | Denied for destructive and IAM/KMS/secrets/CloudTrail actions |
| Console login without MFA            | Blocked by IAM Identity Center                                |
| CLI call via SSO without MFA         | Blocked; SSO session requires MFA at authentication           |

### Terraform implementation

```hcl
resource "aws_iam_policy" "mfa_enforcement" {
  name        = "gtcx-${var.environment}-mfa-enforcement"
  description = "Deny all API calls without MFA authentication"
  policy      = file("${path.module}/policies/mfa-enforcement.json")
}

resource "aws_iam_group_policy_attachment" "mfa_enforcement" {
  group      = aws_iam_group.all_humans.name
  policy_arn = aws_iam_policy.mfa_enforcement.arn
}
```

---

## 5. GitHub Organization MFA Enforcement

### Configuration

| Setting                             | Value                                             |
| ----------------------------------- | ------------------------------------------------- |
| `Require two-factor authentication` | Enabled (organization-level)                      |
| SAML SSO                            | Enforced with MFA at IdP                          |
| Grace period for new members        | 0 days (MFA required before any access)           |
| Non-compliant members               | Automatically removed from organization           |
| Deploy keys                         | Scoped to specific repositories; no org-wide keys |

### Enforcement commands

```bash
# Enable 2FA requirement on the organization
gh api orgs/gtcx-ecosystem --method PATCH \
  --field two_factor_requirement_enabled=true

# Audit org members for MFA compliance
gh api orgs/gtcx-ecosystem/members?filter=2fa_disabled --jq '.[].login'
```

Any member returned by the audit query is a compliance finding. The member must enable MFA within 24 hours or be removed from the organization.

---

## 6. VPN Access MFA

| Parameter        | Value                                                     |
| ---------------- | --------------------------------------------------------- |
| VPN solution     | WireGuard with OIDC authentication                        |
| MFA enforcement  | Required at OIDC provider before tunnel establishment     |
| Session duration | 12 hours maximum; re-authentication required daily        |
| Device posture   | Endpoint must have disk encryption and current OS updates |
| Split tunnel     | Enabled; only GTCX traffic routes through VPN             |

### Authentication flow

1. Engineer initiates VPN connection.
2. VPN client redirects to OIDC provider (IAM Identity Center).
3. OIDC provider requires MFA (hardware key or TOTP).
4. On successful MFA, OIDC provider issues a token with `amr: ["mfa"]` claim.
5. VPN gateway validates the token and the `mfa` claim before establishing the tunnel.
6. Tunnel is established with a 12-hour lifetime.

---

## 7. Hardware Key (YubiKey) Provisioning

### Onboarding

| Step | Action                                                              | Owner             |
| ---- | ------------------------------------------------------------------- | ----------------- |
| 1    | Order 2x YubiKey 5 NFC for new team member                          | IT Operations     |
| 2    | Ship keys to team member (tracked delivery)                         | IT Operations     |
| 3    | Team member registers both keys with AWS, GitHub, and OIDC provider | Team member       |
| 4    | IT verifies both keys are registered                                | IT Operations     |
| 5    | Production access is provisioned                                    | Security Engineer |

Production access is **not** granted until both keys are confirmed registered.

### Key management

| Scenario                    | Procedure                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Primary key lost or damaged | Use backup key immediately; report to IT within 24 hours                                 |
| Backup key lost or damaged  | Report to IT within 24 hours; replacement ordered same day                               |
| Both keys lost              | Emergency procedure (see Section 8)                                                      |
| Key compromise suspected    | Report to Security immediately; all sessions revoked; keys deregistered; new keys issued |
| Employee offboarding        | Both keys collected or remotely deregistered; all sessions revoked                       |

---

## 8. Recovery Procedure for Lost MFA Device

### If backup key is available

1. Authenticate using the backup hardware key.
2. Deregister the lost primary device from all services.
3. Request a replacement primary key from IT Operations.
4. Register the replacement key within 48 hours.

### If no MFA device is available (both keys lost)

| Step | Action                                                                                                               | SLA                |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1    | Engineer contacts Security team via out-of-band channel (phone call to CISO or Security Engineer)                    | Immediate          |
| 2    | Security team revokes all active sessions for the engineer's identity                                                | Within 15 minutes  |
| 3    | Identity re-verification: live video call with government-issued photo ID, verified by manager and Security Engineer | Within 4 hours     |
| 4    | Security team issues temporary recovery code (single-use, 1-hour expiry)                                             | After verification |
| 5    | Engineer uses recovery code to register a new hardware key                                                           | Within 1 hour      |
| 6    | Engineer registers backup key                                                                                        | Within 48 hours    |
| 7    | Security team confirms both keys registered; access restored                                                         | Within 48 hours    |
| 8    | Incident logged in audit database as MFA recovery event                                                              | Automatic          |

**At no point is single-factor access granted during recovery.** The recovery code constitutes one factor (something the engineer has, received out-of-band); the identity verification constitutes the second factor (something the engineer is).

**Recovery SLA:** 4 hours (business hours), 8 hours (after hours).

---

## 9. Monitoring and Compliance

| Alert                                      | Trigger                              | Action                                               |
| ------------------------------------------ | ------------------------------------ | ---------------------------------------------------- |
| Non-MFA API call detected                  | CloudTrail event without MFA context | Auto-blocked by IAM policy; alert to Security        |
| GitHub member without MFA                  | Nightly audit script                 | Auto-removed from organization after 24-hour warning |
| VPN connection without `mfa` claim         | VPN gateway log                      | Connection rejected; alert to Security               |
| MFA device not registered after onboarding | 72 hours post-account creation       | Access suspended; escalation to manager              |
| Hardware key inventory mismatch            | Quarterly hardware audit             | Investigation opened                                 |

### Quarterly compliance check

```bash
# AWS: Generate and check credential report for users without MFA
aws iam generate-credential-report
aws iam get-credential-report --query 'Content' --output text | base64 -d | \
  awk -F, '$4 == "false" {print $1, "NO_MFA"}'

# GitHub: List members without 2FA
gh api orgs/gtcx-ecosystem/members?filter=2fa_disabled --jq '.[].login'
```

Any findings from quarterly checks are remediated within 14 calendar days or the user's access is suspended.

---

## 10. Service Account Exemptions

Service accounts (IRSA roles, CI/CD pipeline identities) are exempt from MFA but must satisfy all of the following compensating controls:

| Control             | Requirement                                                    |
| ------------------- | -------------------------------------------------------------- |
| Credential lifetime | Short-lived tokens only (< 1 hour session)                     |
| Network restriction | IP-restricted to VPC endpoints; no public internet access      |
| Audit logging       | CloudTrail logging for all API calls                           |
| Scope               | Least-privilege IAM policies; no admin or wildcard permissions |
| Review              | Annual review of all service account permissions by CISO       |
| Approval            | CISO approval required for each service account exemption      |

All exemptions are recorded in the compliance tracking system and included in quarterly reviews.

---

## 11. Regulatory Traceability

| Control                     | SOC 2        | ISO 27001 | NIST 800-53      | PCI-DSS |
| --------------------------- | ------------ | --------- | ---------------- | ------- |
| Multi-factor authentication | CC6.1, CC6.6 | A.9.4.2   | IA-2(1), IA-2(2) | 8.3     |
| Authentication strength     | CC6.1        | A.9.4.3   | IA-2(12)         | 8.3.1   |
| Credential management       | CC6.1        | A.9.2.4   | IA-5             | 8.2     |
| Session management          | CC6.1        | A.9.4.2   | SC-23            | 8.1.8   |
| Phishing-resistant auth     | CC6.6        | A.9.4.2   | IA-2(6)          | 8.3.2   |

---

_Last updated: 2026-05-08_  
_Review cycle: Quarterly_
