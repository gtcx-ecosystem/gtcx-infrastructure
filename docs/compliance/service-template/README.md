# Service Compliance README — Template

> Copy this file into `docs/compliance/service/README.md` in your service repo.

---

## Inherited Platform Compliance

This service runs on the GTCX shared platform. The following compliance artifacts are inherited from [`gtcx-infrastructure`](https://github.com/gtcx-ecosystem/gtcx-infrastructure):

| Control                                | Inherited From        | Evidence                                    |
| -------------------------------------- | --------------------- | ------------------------------------------- |
| Infrastructure pen-test                | `gtcx-infrastructure` | [Platform pen-test report](link-to-release) |
| SOC 2 Type I — CC6/CC7/CC8/CC9         | `gtcx-infrastructure` | [SOC 2 Type I report](link-to-release)      |
| CI/CD security (SLSA L3, Cosign, SBOM) | `gtcx-infrastructure` | [CI security docs](link)                    |
| Network segmentation                   | `gtcx-infrastructure` | [NetworkPolicies](link)                     |
| WAF / DDoS protection                  | `gtcx-infrastructure` | [WAF rules](link)                           |
| Backup / DR                            | `gtcx-infrastructure` | [DR runbook](link)                          |
| IAM / OIDC                             | `gtcx-infrastructure` | [CI role docs](link)                        |

---

## Service-Specific Compliance

### 1. Data Handling

| Data Type   | Stored                         | Encrypted at Rest     | Encrypted in Transit | Retention    |
| ----------- | ------------------------------ | --------------------- | -------------------- | ------------ |
| PII         | Yes/No                         | AES-256-GCM           | TLS 1.3              | X days       |
| Credentials | Yes/No                         | KMS / HashiCorp Vault | TLS 1.3              | N/A (hashed) |
| Audit logs  | Forwarded to platform audit DB | Inherited             | Inherited            | 7 years      |

### 2. API Surface

| Endpoint       | Auth Required | Rate Limited | Audit Logged | Notes |
| -------------- | ------------- | ------------ | ------------ | ----- |
| `GET /v1/...`  | Yes           | Yes          | Yes          | ...   |
| `POST /v1/...` | Yes           | Yes          | Yes          | ...   |

### 3. Application Pen-Test

| Date       | Tester | Scope   | Findings | Status      |
| ---------- | ------ | ------- | -------- | ----------- |
| YYYY-MM-DD | [Firm] | [Scope] | [Link]   | Open/Closed |

### 4. Risk Assessment

| Risk   | Likelihood   | Impact       | Mitigation   | Owner   |
| ------ | ------------ | ------------ | ------------ | ------- |
| [Risk] | Low/Med/High | Low/Med/High | [Mitigation] | [Owner] |

---

## Compliance Contacts

| Role                      | Repo                  | Contact                          |
| ------------------------- | --------------------- | -------------------------------- |
| Platform compliance owner | `gtcx-infrastructure` | `@gtcx-infra-team`               |
| Service compliance owner  | This repo             | `@service-owner`                 |
| CISO escalation           | `gtcx-infrastructure` | `security-escalation@gtcx.trade` |
