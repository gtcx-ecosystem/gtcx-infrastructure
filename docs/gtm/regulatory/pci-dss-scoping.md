---
title: 'PCI-DSS Scoping Assessment'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# PCI-DSS Scoping Assessment

**Document ID**: GTCX-PCIDSS-SCOPE-001
**Version**: 1.0
**Date**: May 2026
**Classification**: Internal
**Owner**: CISO
**Remediation Plan Reference**: Phase 3.1, Item 3.1.4

---

## 1. Executive Summary

**GTCX does not currently process, store, or transmit cardholder data (CHD) or sensitive authentication data (SAD).** The platform handles trade compliance data, digital identity credentials, and commodity settlement information — none of which falls under PCI-DSS scope.

This document explicitly records this determination, defines the architectural boundaries that maintain this posture, and provides a future-proofing plan should GTCX introduce payment processing capabilities.

---

## 2. Current State Assessment

### 2.1 Cardholder Data Inventory

| Data Element                 | Stored | Processed | Transmitted | Location |
| ---------------------------- | ------ | --------- | ----------- | -------- |
| Primary Account Number (PAN) | No     | No        | No          | N/A      |
| Cardholder Name              | No     | No        | No          | N/A      |
| Expiration Date              | No     | No        | No          | N/A      |
| Service Code                 | No     | No        | No          | N/A      |
| Full Track Data              | No     | No        | No          | N/A      |
| CAV2/CVC2/CVV2/CID           | No     | No        | No          | N/A      |
| PIN / PIN Block              | No     | No        | No          | N/A      |

### 2.2 Payment-Adjacent Data Flows

GTCX handles the following financial data that is explicitly **not** cardholder data:

| Data Type               | Description                                | PCI Relevance |
| ----------------------- | ------------------------------------------ | ------------- |
| Settlement amounts      | Commodity trade settlement values          | Not CHD       |
| Bank reference numbers  | Reference IDs for wire transfers           | Not CHD       |
| Trade invoices          | Commodity trade documentation              | Not CHD       |
| DID credentials         | Decentralized identity for trade operators | Not CHD       |
| Compliance scores (GCI) | Operator compliance ratings                | Not CHD       |

### 2.3 Determination

**SAQ type: Not Applicable** — GTCX is not a merchant, service provider, or payment processor under PCI-DSS definitions. No Self-Assessment Questionnaire or Report on Compliance is required at this time.

---

## 3. Cardholder Data Flow Diagram

Since GTCX does not handle cardholder data, the data flow diagram below shows the current architecture with payment exclusion boundaries clearly marked.

```
                    ┌──────────────────────────────────────────────┐
                    │              GTCX Platform                    │
                    │                                              │
  ┌──────────┐     │  ┌────────────┐    ┌────────────────────┐    │
  │ gtcx-app │────▶│  │ Replay     │    │ AGX / CRX / SGX    │    │
  │ (mobile) │     │  │ Guard API  │    │ Platform Services  │    │
  └──────────┘     │  └────────────┘    └────────────────────┘    │
                    │         │                    │                │
                    │         ▼                    ▼                │
                    │  ┌────────────┐    ┌────────────────────┐    │
                    │  │ PostgreSQL │    │ PostgreSQL         │    │
                    │  │ (audit)    │    │ (operational)      │    │
                    │  └────────────┘    └────────────────────┘    │
                    │                                              │
                    │  ════════════════════════════════════════    │
                    │  ║  NO CARDHOLDER DATA ENTERS THIS ZONE ║    │
                    │  ════════════════════════════════════════    │
                    └──────────────────────────────────────────────┘
                                        │
                                        │ Settlement references
                                        │ (bank wire refs only,
                                        │  no card data)
                                        ▼
                    ┌──────────────────────────────────────────────┐
                    │         External Banking Systems              │
                    │  (Wire transfers, not card payments)          │
                    └──────────────────────────────────────────────┘
```

---

## 4. Network Segmentation Strategy

Even though PCI-DSS is not currently applicable, GTCX maintains network segmentation as a defense-in-depth practice:

| Segment            | Purpose                  | Isolation Method                                                      |
| ------------------ | ------------------------ | --------------------------------------------------------------------- |
| Public subnet      | ALB, NAT gateway         | AWS VPC subnet with security groups                                   |
| Application subnet | K8s worker nodes         | Private subnet, no direct internet access                             |
| Data subnet        | PostgreSQL (operational) | Private subnet, security group restricted to app subnet               |
| Audit subnet       | PostgreSQL (audit)       | Separate private subnet (port 5433), restricted to audit writers only |
| Management subnet  | Bastion / VPN            | Restricted CIDR, MFA-gated access                                     |

### 4.1 Future-State Segmentation (If Payment Processing Added)

If GTCX introduces card payment capabilities, the following additional segments would be required:

| Segment                           | Purpose                                  | PCI Requirement              |
| --------------------------------- | ---------------------------------------- | ---------------------------- |
| Cardholder Data Environment (CDE) | Systems that store/process/transmit CHD  | Full PCI-DSS scope           |
| Connected-to segment              | Systems with network connectivity to CDE | Reduced but in-scope         |
| Out-of-scope segment              | Systems with no connectivity to CDE      | Excluded from PCI assessment |

---

## 5. ASV Scan Requirements

### 5.1 Current State

**Not required.** Approved Scanning Vendor (ASV) quarterly external vulnerability scans are only required for entities handling cardholder data.

### 5.2 Existing Vulnerability Scanning

Despite PCI non-applicability, GTCX performs vulnerability scanning as part of standard security practices:

| Scan Type            | Tool                | Frequency       | Coverage                 |
| -------------------- | ------------------- | --------------- | ------------------------ |
| Dependency audit     | pnpm audit          | Per CI build    | All npm dependencies     |
| Container image scan | Trivy (planned)     | Per image build | Base images and packages |
| SAST                 | CodeQL (planned)    | Per PR          | Source code              |
| DAST                 | OWASP ZAP (planned) | Weekly          | Staging endpoints        |
| Infrastructure       | Terraform validate  | Per CI build    | IaC configurations       |

### 5.3 Future-State ASV Requirements

If PCI-DSS becomes applicable:

- Quarterly external ASV scans of all internet-facing IP addresses in CDE
- Passing scan required (no exploitable vulnerabilities rated 4.0+ CVSS)
- ASV must be PCI SSC approved (list at pcisecuritystandards.org)
- Scan reports retained for 12 months minimum

---

## 6. QSA Engagement Timeline

### 6.1 Current State

**Not required.** No Qualified Security Assessor engagement is needed since GTCX does not handle cardholder data.

### 6.2 Trigger Events for PCI-DSS Engagement

GTCX must initiate PCI-DSS scoping if any of the following occur:

| Trigger                                                         | SAQ Type                           | Timeline                |
| --------------------------------------------------------------- | ---------------------------------- | ----------------------- |
| Integrate a payment gateway with redirect (no CHD touches GTCX) | SAQ-A                              | 3 months to compliance  |
| Accept card payments via hosted payment page (iframe)           | SAQ-A-EP                           | 6 months to compliance  |
| Process card payments directly via API                          | SAQ-D (or ROC if >6M transactions) | 12 months to compliance |
| Store PAN for recurring billing                                 | SAQ-D (or ROC)                     | 12 months to compliance |
| Act as a payment facilitator (PayFac)                           | ROC (Level 1)                      | 18 months to compliance |

### 6.3 Future QSA Engagement Plan

If triggered, the following timeline applies:

| Phase                      | Duration   | Activities                                                |
| -------------------------- | ---------- | --------------------------------------------------------- |
| Scoping and gap assessment | 4 weeks    | QSA engagement, data flow mapping, gap analysis           |
| Remediation                | 8-16 weeks | Implement required controls based on gap assessment       |
| Pre-assessment             | 2 weeks    | QSA dry run of full assessment                            |
| Formal assessment          | 4-6 weeks  | QSA conducts on-site/remote assessment                    |
| Report issuance            | 4 weeks    | ROC or SAQ signed and submitted to acquirer/payment brand |

---

## 7. Future-Proofing Plan

### 7.1 Architectural Decisions to Maintain PCI Non-Applicability

The following design principles reduce future PCI scope if payment capabilities are added:

| #    | Principle                    | Implementation                                                                                                      |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| FP-1 | **Never touch card data**    | Use redirect-based payment (Stripe Checkout, Adyen Drop-in) so CHD never enters GTCX systems                        |
| FP-2 | **Tokenization at the edge** | If card data must be referenced, use payment provider tokens (e.g., Stripe PaymentMethod IDs) — never raw PAN       |
| FP-3 | **Separate payment service** | If payment processing is required, isolate it in a dedicated microservice with its own database and network segment |
| FP-4 | **No PAN logging**           | Configure application logging to mask/exclude any pattern matching card numbers (Luhn-valid 13-19 digit sequences)  |
| FP-5 | **PCI-aware infrastructure** | Use PCI-compliant hosting (AWS PCI DSS Level 1 service provider) and document shared responsibility                 |

### 7.2 Payment Integration Decision Tree

```
Will GTCX accept payments?
├── No → Document annually, maintain this scoping doc
└── Yes
    ├── Can we use redirect/hosted page (Stripe Checkout)?
    │   ├── Yes → SAQ-A (simplest; ~30 requirements)
    │   └── No
    │       ├── Can we use tokenization (never see PAN)?
    │       │   ├── Yes → SAQ-A-EP (~140 requirements)
    │       │   └── No → SAQ-D or ROC (~300+ requirements)
    │       └── Will we store PAN?
    │           ├── Yes → SAQ-D/ROC + encryption + key management
    │           └── No → SAQ-C or SAQ-C-VT depending on method
    └── Volume > 6M transactions/year?
        ├── Yes → Level 1: ROC by QSA (mandatory)
        └── No → Level 2-4: SAQ acceptable
```

### 7.3 Recommended Approach

**Strong recommendation: Maintain SAQ-A eligibility by using redirect-based payment integration.** This minimizes PCI scope to approximately 30 requirements (vs. 300+ for SAQ-D) and eliminates the need for:

- Quarterly ASV scans of GTCX infrastructure (ASV scans the payment provider instead)
- Annual penetration testing of payment systems
- Formal QSA engagement (self-assessment is sufficient)
- Dedicated CDE network segmentation
- PCI-specific encryption key management

---

## 8. Annual Review

This scoping document must be reviewed and reaffirmed annually, or upon any of the following events:

- New payment-related feature planned or deployed
- Change in payment provider or integration method
- Acquisition or merger with entity that handles cardholder data
- Regulatory or contractual requirement change
- Annual compliance review cycle

| Review Date | Reviewer | Determination                     | Next Review |
| ----------- | -------- | --------------------------------- | ----------- |
| May 2026    | CISO     | Not applicable — no CHD processed | May 2027    |
|             |          |                                   |             |
|             |          |                                   |             |

---

## 9. Attestation

By signing below, the undersigned confirms that GTCX does not process, store, or transmit cardholder data as of the review date, and that this determination has been made after thorough review of all data flows and system architectures.

| Role                      | Name | Signature | Date |
| ------------------------- | ---- | --------- | ---- |
| CISO                      |      |           |      |
| CTO                       |      |           |      |
| Platform Engineering Lead |      |           |      |
