# Pen-Test Vendor Shortlist & Evaluation

**Date:** 2026-05-12
**Budget:** $25,000–$45,000 USD
**Target start:** 2026-05-26
**Target completion:** 2026-06-30
**Required accreditation:** CREST, OSCP-led team, or equivalent

---

## Evaluation Criteria

| #   | Criterion                                        | Weight | Why it matters for GTCX                           |
| --- | ------------------------------------------------ | ------ | ------------------------------------------------- |
| 1   | **CREST / OSCP accreditation**                   | 20%    | Hard requirement for central-bank-adjacent pilots |
| 2   | **African presence & POPIA knowledge**           | 20%    | Local time zone, regulatory context, B-BBEE       |
| 3   | **AI/ML attack-vector experience**               | 15%    | Prompt injection, tool segregation, LLM routing   |
| 4   | **Compliance report quality (SOC 2, ISO 27001)** | 15%    | Output must be auditor-ready for SOC 2 Type I     |
| 5   | **Price fit ($25k–$45k)**                        | 15%    | Budget ceiling is firm for this engagement        |
| 6   | **Speed to start (≤2 weeks)**                    | 10%    | Pilot timeline is fixed; delays block SOC 2       |
| 7   | **Re-test included**                             | 5%     | Critical/high findings must be verified           |

---

## Shortlist

### 1. Orange Cyberdefense SensePost — **Recommended**

| Attribute            | Detail                                              |
| -------------------- | --------------------------------------------------- |
| **HQ**               | Pretoria, SA (global Orange network)                |
| **Size**             | 250+ researchers, 18 SOCs                           |
| **Accreditation**    | CREST, ISO 27001, PCI DSS                           |
| **African presence** | ✅ Strong — largest pentest team in SA              |
| **AI experience**    | ✅ Research-led; publishes AI/ML offensive research |
| **Price estimate**   | $35k–$50k (may negotiate to $45k)                   |
| **Speed to start**   | 2–3 weeks (enterprise procurement)                  |
| **Re-test**          | ✅ Included in enterprise package                   |

**Strengths:**

- 25+ years offensive security heritage (SensePost brand)
- Deep compliance expertise — reports map directly to ISO 27001 / SOC 2 controls
- Local SA team means POPIA-aware data-handling and B-BBEE credentials
- Can bundle with ongoing MDR/SOC if GTCX scales

**Risks:**

- Enterprise pricing; may exceed ceiling without negotiation
- Bureaucratic procurement; slower than boutique firms
- Less agile for mid-market scope

**Score:** 8.4 / 10

---

### 2. Nclose

| Attribute            | Detail                                              |
| -------------------- | --------------------------------------------------- |
| **HQ**               | Cape Town, SA                                       |
| **Size**             | ~50–100                                             |
| **Accreditation**    | CREST, ISO 27001                                    |
| **African presence** | ✅ Pure SA firm; deep POPIA expertise               |
| **AI experience**    | ⚠️ Unknown — would need to validate in RFP response |
| **Price estimate**   | $25k–$35k (good fit)                                |
| **Speed to start**   | 1–2 weeks                                           |
| **Re-test**          | ✅ Included                                         |

**Strengths:**

- Best price-to-value for the budget
- Pure local firm — no offshore data-handling concerns
- Strong regulatory focus (banking, insurance, POPIA)
- Faster engagement start than enterprise vendors

**Risks:**

- Unclear depth on AI-specific attack vectors
- Smaller team may limit parallel testing scope
- Less international brand recognition for auditor credibility

**Score:** 7.6 / 10

---

### 3. Telspace Africa

| Attribute            | Detail                              |
| -------------------- | ----------------------------------- |
| **HQ**               | Johannesburg, SA                    |
| **Size**             | ~30–50                              |
| **Accreditation**    | CREST, B-BBEE Level 2               |
| **African presence** | ✅ Veteran SA red teamers           |
| **AI experience**    | ⚠️ Unknown — would need to validate |
| **Price estimate**   | $28k–$40k                           |
| **Speed to start**   | 1–2 weeks                           |
| **Re-test**          | ✅ Included                         |

**Strengths:**

- Deep offensive security heritage ("hackers for hire" model)
- Strong on network/app pentest and red teaming
- B-BBEE Level 2 — procurement advantage for DFI/government pilots
- Highly responsive, less bureaucratic

**Risks:**

- May lack compliance-report polish for SOC 2 auditors
- AI/ML testing experience unverified
- Smaller scale = less redundancy if key tester unavailable

**Score:** 7.2 / 10

---

## Recommendation

**Primary:** Orange Cyberdefense SensePost

- Highest accreditation + local presence + compliance report quality
- Budget risk is manageable with negotiation (shrink scope to 4 weeks, exclude re-test if needed)
- Their AI research practice aligns with GTCX's AI gateway attack surface

**Fallback:** Nclose

- If SensePost pricing or procurement timeline slips
- Request AI-specific methodology addendum in RFP response

---

## Next Steps

| Step                                                    | Owner                           | Due        |
| ------------------------------------------------------- | ------------------------------- | ---------- |
| 1. Send 1-page RFP to SensePost + Nclose                | Security / Leadership           | 2026-05-13 |
| 2. Evaluate proposals (price, timeline, AI methodology) | Platform Engineering + Security | 2026-05-16 |
| 3. Legal review of engagement letter                    | Legal                           | 2026-05-19 |
| 4. Execute engagement letter + credential handover      | Security                        | 2026-05-23 |
| 5. Kickoff call                                         | All                             | 2026-05-26 |

---

## RFP Outreach Template

> **Subject:** RFP — Penetration Test: GTCX Protocol (Staging + Testnet)
>
> GTCX Protocol is an AI-native compliance gateway for African commodity trade. We require an independent penetration test of our staging and testnet environments before a regulated pilot deployment.
>
> **Scope:** Web APIs (6 protocol handlers), AI gateway (`/v1/query`, `/v1/tools`), Kubernetes ingress/ALB, PostgreSQL (primary + audit), Redis, ECR images, CI/CD pipeline.
> **Methodology:** OWASP Testing Guide v4.2 + AI-specific vectors (prompt injection, tool enumeration, mutating tool bypass).
> **Timeline:** ~20 business days (4 weeks) + 3-day re-test window.
> **Budget:** $25,000–$45,000 USD.
> **Deliverables:** Executive summary, technical findings (PDF + JSON), remediation roadmap, signed attestation.
> **Accreditation required:** CREST or OSCP-led team.
>
> Full scope document attached. Please confirm availability for a 2026-05-26 kickoff and provide a fixed-price proposal by 2026-05-16.
>
> Contact: security@gtcx.trade
