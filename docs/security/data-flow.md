# Data Flow Diagram — External API and Egress Mapping

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

What leaves the VPC, where it goes, what data it carries, and what agreements govern it.

---

## Network Boundary

All GTCX services run inside a private VPC (`10.1.0.0/16`) in `af-south-1` (Cape Town). Services communicate over the internal `gtcx-network` bridge (Docker) or ClusterIP services (Kubernetes). The following table documents every connection that crosses the VPC boundary.

---

## External Egress Map

| Service          | Destination                         | Region               | Protocol      | Data Sent                                                                                                 | Data Received                                           | Encryption                                                                          | DPA Status                                  |
| ---------------- | ----------------------------------- | -------------------- | ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| ANISA            | Anthropic API (`api.anthropic.com`) | us-east-1 (Virginia) | HTTPS/TLS 1.3 | Trade queries, cultural context prompts (may include operator names, commodity types, jurisdiction codes) | LLM completions (regulatory guidance, cultural context) | TLS in transit; Anthropic retains for 30 days per their data policy                 | **No DPA executed** — required before pilot |
| Intelligence SDK | ComplyAdvantage API                 | eu-west-1 (Ireland)  | HTTPS/TLS 1.3 | Entity names, nationality, DOB for AML/KYC screening                                                      | Match results, risk scores, PEP/sanctions flags         | TLS in transit; ComplyAdvantage stores screening results per their retention policy | **No DPA executed** — required before pilot |
| All services     | AWS Secrets Manager                 | af-south-1           | HTTPS/TLS 1.3 | Secret ARNs (no secret values in request path)                                                            | Decrypted secret values (DB credentials, API keys)      | TLS in transit; KMS at rest                                                         | AWS DPA covers (BAA available)              |
| All services     | AWS CloudWatch Logs                 | af-south-1           | HTTPS/TLS 1.3 | Structured log events (sanitized — no PII in logs per policy)                                             | None                                                    | TLS in transit; KMS at rest                                                         | AWS DPA covers                              |
| KYC Documents    | AWS S3 (`gtcx-kyc-docs-*`)          | af-south-1           | HTTPS/TLS 1.3 | Identity documents (passport, mining license) via presigned PUT                                           | Presigned GET URLs for retrieval                        | TLS in transit; SSE-KMS at rest; 5-year retention                                   | AWS DPA covers                              |
| Terraform        | AWS S3 (state bucket)               | af-south-1           | HTTPS/TLS 1.3 | Infrastructure state (resource IDs, config values)                                                        | State file                                              | TLS in transit; SSE-KMS at rest; versioned                                          | AWS DPA covers                              |
| Terraform        | AWS DynamoDB (lock table)           | af-south-1           | HTTPS/TLS 1.3 | Lock ID (state locking)                                                                                   | Lock status                                             | TLS in transit                                                                      | AWS DPA covers                              |
| DNS              | AWS Route 53 / VPC DNS              | us-east-1 (global)   | UDP/53        | Domain resolution queries                                                                                 | IP addresses                                            | Unencrypted (standard DNS)                                                          | N/A                                         |
| NTP              | Amazon Time Sync                    | Regional             | NTP/UDP 123   | Time sync request                                                                                         | Timestamp                                               | Unencrypted (standard NTP)                                                          | N/A                                         |

---

## Data Sovereignty Assessment

### Data that stays in Africa (af-south-1)

- PostgreSQL operational database (RDS)
- PostgreSQL audit database (RDS)
- Redis cache
- NATS JetStream events
- KYC identity documents (S3)
- Terraform state (S3)
- CloudWatch logs
- Container images (ECR)
- All inter-service communication

### Data that leaves Africa

| Data                  | Destination                 | Justification                                     | Mitigation                                                                                 |
| --------------------- | --------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Trade query prompts   | Anthropic API (us-east-1)   | No Anthropic inference endpoint in af-south-1     | Minimize PII in prompts; strip operator names before sending; negotiate DPA with Anthropic |
| Entity screening data | ComplyAdvantage (eu-west-1) | Screening service is SaaS — no self-hosted option | Minimize fields sent (name + DOB + nationality only); negotiate DPA                        |
| DNS queries           | Global                      | Standard internet operation                       | Use VPC DNS resolver (stays in-VPC for internal names)                                     |

---

## AI-Specific Data Flows

### ANISA (Cultural Intelligence)

```
Operator query → AGX API → ANISA service → Anthropic API
                                ↓
                    Prompt includes:
                    - Commodity type (e.g., "gold", "tantalite")
                    - Jurisdiction (e.g., "ZW", "GH")
                    - Query text (may include operator context)

                    Prompt MUST NOT include:
                    - Operator real name (use DID or pseudonym)
                    - Bank account numbers
                    - Physical addresses
                    - Identity document numbers
```

**Risk**: If ANISA prompts include PII, that PII is sent to Anthropic servers in Virginia. Prompt sanitization must be enforced at the application layer (5-intelligence repo, not this repo).

**Recommendation**: Add a prompt sanitization middleware in ANISA that strips PII patterns (names, ID numbers, addresses) before sending to Anthropic. Log sanitized prompts for audit.

### Screening (ComplyAdvantage)

```
Operator registration → AGX API → Intelligence SDK → ComplyAdvantage API
                                        ↓
                            Request includes:
                            - Full name
                            - Date of birth
                            - Nationality
                            - Country of residence

                            Response includes:
                            - Match/no-match
                            - Risk score
                            - PEP status
                            - Sanctions list hits
```

**Risk**: Full name and DOB are transmitted to a third-party service. This is required for AML/KYC compliance — you cannot screen without identifying information.

**Mitigation**: Ensure ComplyAdvantage DPA is executed. Verify their data retention policy aligns with GTCX's 5-year FATF requirement. Log screening requests with hashed PII for audit trail.

---

## Required Actions Before Pilot

1. **Execute DPA with Anthropic** — covers ANISA LLM calls containing trade context
2. **Execute DPA with ComplyAdvantage** — covers entity screening PII
3. **Implement prompt sanitization in ANISA** — strip PII before Anthropic calls (5-intelligence repo)
4. **Document data residency for ZWCMP stakeholders** — provide this file as evidence that operational data stays in af-south-1
5. **Configure VPC DNS resolver** — ensure internal service discovery doesn't leak to public DNS
