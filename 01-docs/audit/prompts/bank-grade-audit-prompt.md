---
title: 'Bank-Grade Audit Prompt'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'security-assessor'
tier: 'critical'
tags: ['audit-prompt', 'bank-grade', 'automated-assessment']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Bank-Grade Audit Prompt (B-GAP)

**Version:** 1.0  
**Target Grade:** Bank-Grade  
**Framework Reference:** `01-docs/05-audit/audit-grade-framework.md` §2.4  
**Execution Time:** 6–12 hours  
**Validator:** Self-assessment (AI agent) + external auditor + regulatory counsel

> **Trigger:** Run this prompt when engaging banking partnerships, payment processing, card issuance, or correspondent banking relationships.

---

## 1. Goal

Determine whether GTCX meets Bank-Grade security standards for banks, insurers, payment processors, and card networks handling financial transactions.

**Pass threshold:** ≥ 9.0/10  
**Prerequisite:** Enterprise-Grade score ≥ 8.5

> **Note:** B.1 (SOC 2 Type II), B.2 (PCI DSS), B.3 (red team), B.5 (regulatory), and B.8 (BCP witness) require external validation. AI agent assesses readiness only.

---

## 2. Evidence Collection Commands

### B.1 — SOC 2 Type II

```bash
# Verify Type I completed first
cat 01-docs/05-audit/prompts/evidence/enterprise-grade-evidence.json 2>/dev/null | jq '.external_dependencies[] | select(.control=="E.1") | .status' || echo "Run E-GAP first"
# Check for Type II observation period documentation
cat 01-docs/10-compliance/soc2-type2-observation.md 2>/dev/null | head -30 || echo "No Type II observation period doc"
# Check for 12-month evidence trail
find 01-docs/10-compliance/ -name "*evidence*" -o -name "*ticket*" | wc -l
```

**Pass:** Type I complete, Type II observation period ≥ 6 months, evidence trail continuous.
**Score multiplier:** 0.0 if Type I incomplete, 0.5 if observation < 12 months, 1.0 if clean Type II opinion.

### B.2 — PCI DSS Level 1 (if card data)

```bash
# Check for card data handling
grep -ri "card\|pan\|cvv\|pci" 03-platform/tools/*/03-platform/src/ 01-docs/architecture/ | grep -v "discard\|token" | head -10
# Check for QSA engagement
find 01-docs/10-compliance/ -name "*pci*" -o -name "*qsa*" | head -5
# Check for tokenization strategy
cat 01-docs/architecture/payment-tokenization.md 2>/dev/null | head -30 || echo "No tokenization strategy"
```

**Pass:** No raw card data in codebase OR tokenization implemented. QSA engaged if handling CHD.
**Score multiplier:** N/A if no cards (skip with full points), 0.0 if cards + no QSA, 1.0 if AOC received.

### B.3 — Red team exercise (annual)

```bash
# Check for red team scope
cat 01-docs/05-audit/red-team-scope.md 2>/dev/null | head -30 || echo "No red team scope"
# Check for previous red team report
find 01-docs/05-audit/ -name "*red*team*" | head -5
# Check for assumed-breach narrative
grep -ri "assume.breach\|lateral.movement\|pivot" 01-docs/05-audit/ 01-docs/09-security/ | head -10
```

**Pass:** Red team scope defined, exercise completed, lateral movement contained.
**Score multiplier:** 0.5 if scope defined, 1.0 if report shows containment.

### B.4 — Dedicated CISO or vCISO

```bash
# Check for CISO role definition
cat 01-docs/governance/ciso-role.md 2>/dev/null | head -30 || echo "No CISO role defined"
# Check for board reporting
grep -ri "ciso\|security.*board\|monthly.*report" 01-docs/governance/ | head -10
# Check for security org chart
cat 01-docs/hr/security-org-chart.md 2>/dev/null | head -20 || echo "No security org chart"
```

**Pass:** Named CISO or vCISO engaged. Monthly board reporting established.

### B.5 — Regulatory relationship (SARB, FSCA)

```bash
# Check for SARB engagement
cat 01-docs/10-compliance/sarb-engagement.md 2>/dev/null | head -30 || echo "No SARB engagement doc"
# Check for FSCA registration
grep -ri "fsca\|category.*I\|category.*II\|license" 01-docs/10-compliance/ | head -10
# Check for regulatory correspondence
find 01-docs/10-compliance/ -name "*sarb*" -o -name "*fsca*" | head -5
```

**Pass:** SARB notification sent OR FSCA license obtained. No outstanding regulatory findings.
**Score multiplier:** 0.5 if notification sent, 1.0 if license in hand.

### B.6 — Fraud detection + AML monitoring

```bash
# Check for transaction monitoring
cat 01-docs/10-compliance/aml-monitoring.md 2>/dev/null | head -30 || echo "No AML monitoring doc"
# Check for SAR filing process
grep -ri "sar\|suspicious.*activity\|fic\|fincen" 01-docs/10-compliance/ | head -10
# Check for sanctions screening
grep -ri "sanctions\|ofac\|un\|pep" 01-docs/10-compliance/ | head -10
```

**Pass:** AML policy documented, SAR filing process defined, sanctions screening configured.

### B.7 — Segregation of duties (SoD)

```bash
# Check for SoD matrix
cat 01-docs/10-compliance/sod-matrix.md 2>/dev/null | head -40 || echo "No SoD matrix"
# Check for approval workflows in code
grep -ri "approve\|approval\|dual.*control\|four.eyes" 03-platform/tools/*/03-platform/src/ | head -10
# Check IAM for separation
grep -r "gtcx-terraform" 04-ship/terraform/ | grep -i "role\|policy" | head -5
```

**Pass:** SoD matrix documented. No single role can approve + execute financial transactions.

### B.8 — BCP tested annually with evidence

```bash
# Check for DR test evidence
find 01-docs/05-audit/ -name "*dr*test*" -o -name "*disaster*recovery*test*" | head -5
# Check for RTO demonstration
grep -ri "rto.*achieved\|recovery.*time.*demonstrated" 01-docs/05-audit/ | head -5
# Check for external witness
find 01-docs/05-audit/ -name "*witness*" -o -name "*independent*" | head -5
```

**Pass:** DR test executed within 12 months, RTO demonstrated, external witness signed.
**Score multiplier:** 0.5 if test executed, 1.0 if witnessed.

### B.9 — Customer fund segregation

```bash
# Check for trust account documentation
cat 01-docs/financial/trust-account.md 2>/dev/null | head -30 || echo "No trust account doc"
# Check for reconciliation process
grep -ri "reconciliation\|daily\|trust.*account" 01-docs/financial/ | head -10
# Check for CPA audit of trust account
find 01-docs/financial/ -name "*trust*" -o -name "*reconciliation*" | head -5
```

**Pass:** Trust accounts documented, daily reconciliation process, CPA audit trail.

### B.10 — Pen-test every 6 months

```bash
# Check pen-test frequency
cat 01-docs/05-audit/pen-test-schedule.md 2>/dev/null | head -20 || echo "No pen-test schedule"
# Check for two reports in 12 months
find 01-docs/05-audit/ -name "*pen*test*report*" | wc -l
# Check for remediation evidence
find 01-docs/05-audit/ -name "*remediation*" | wc -l
```

**Pass:** Two pen-tests in 12 months, all critical findings remediated.

---

## 3. Scoring Rubric

| Control              | Weight | Pass Criteria                                    | Evidence                  | External? |
| -------------------- | ------ | ------------------------------------------------ | ------------------------- | --------- |
| B.1 SOC 2 Type II    | 20%    | 12-month observation, clean opinion              | Auditor letter            | ✅ Yes    |
| B.2 PCI DSS          | 10%    | AOC from QSA (or N/A with tokenization)          | AOC or architecture doc   | ✅ Yes    |
| B.3 Red team         | 15%    | Annual exercise, lateral movement contained      | Red team report           | ✅ Yes    |
| B.4 CISO             | 10%    | Named CISO/vCISO, monthly board reports          | Role doc, meeting minutes | ❌ No     |
| B.5 Regulatory       | 10%    | SARB/FSCA license or notification                | License/letter            | ✅ Yes    |
| B.6 Fraud/AML        | 10%    | AML policy, SAR process, sanctions screening     | Policy docs               | ❌ No     |
| B.7 SoD              | 5%     | Matrix documented, enforced in IAM               | SoD matrix                | ❌ No     |
| B.8 BCP witnessed    | 10%    | Annual DR test, RTO demonstrated, witness signed | Test report               | ✅ Yes    |
| B.9 Fund segregation | 5%     | Trust accounts, daily reconciliation             | Financial docs            | ❌ No     |
| B.10 Pen-test 6mo    | 5%     | Two tests/year, critical findings remediated     | Two reports               | ✅ Yes    |

**Preliminary Score = Σ(control_score × weight) × 10**  
**Final Score = Preliminary × 0.6 if any external control incomplete**

---

## 4. Output Format

Produce a JSON file at `01-docs/05-audit/prompts/evidence/bank-grade-evidence.json`:

```json
{
  "grade": "Bank-Grade",
  "date": "2026-05-10",
  "version": "1.0",
  "prerequisite_met": true,
  "preliminary_score": 0.0,
  "final_score": 0.0,
  "status": "ready|not-ready|pending-external",
  "threshold": 9.0,
  "regulatory_jurisdiction": "ZA",
  "external_dependencies": [
    {
      "control": "B.1",
      "status": "pending",
      "blocker": "Type I not yet complete",
      "estimated_timeline": "Q2 2027"
    }
  ],
  "controls": [...],
  "recommendations": [],
  "banking_readiness": "red|yellow|green",
  "next_review": "2026-08-10"
}
```

---

## 5. Failure Modes

| Scenario                                | Action                                                               |
| --------------------------------------- | -------------------------------------------------------------------- |
| B.1 Type II incomplete                  | Bank partnership blocked until Type II in hand                       |
| B.2 PCI DSS fails                       | Cannot handle card data. Implement tokenization or partner with PSP. |
| B.3 Red team: lateral movement succeeds | CRITICAL — halt banking conversations, remediate architecture        |
| B.5 No FSCA license                     | Cannot operate as financial services provider in SA                  |
| B.6 No AML policy                       | Regulatory violation risk. Immediate legal engagement required.      |
| B.7 SoD violation                       | Fraud risk. Restructure IAM + approval workflows immediately.        |
| Score < 9.0                             | Bank will reject. No correspondent relationship possible.            |

---

## 6. South Africa-Specific Requirements

| Requirement                          | Regulatory Body            | GTCX Status                              |
| ------------------------------------ | -------------------------- | ---------------------------------------- |
| FSCA Category I/II license           | FSCA                       | Not started                              |
| SARB clearance for payment system    | South African Reserve Bank | Not started                              |
| PAIA manual                          | Info Regulator             | Not started                              |
| FICA compliance (KYC/AML)            | FIC                        | Partial — policy exists, not operational |
| POPIA responsible party registration | Info Regulator             | Partial — notification filed             |

---

## 7. Related Documents

- `01-docs/05-audit/audit-grade-framework.md` §2.4
- `01-docs/05-audit/bank-grade-rating-framework.md`
- `01-docs/05-audit/prompts/enterprise-grade-audit-prompt.md`
- `01-docs/10-compliance/soc2-gap-analysis.md`
- `01-docs/10-compliance/aml-monitoring.md`
