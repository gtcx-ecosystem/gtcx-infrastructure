---
title: 'Investment-Grade Audit Prompt'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'security-assessor'
tier: 'critical'
tags: ['audit-prompt', 'investment-grade', 'automated-assessment']
review_cycle: 'per-funding-round'
---

# Investment-Grade Audit Prompt (I-GAP)

**Version:** 1.0  
**Target Grade:** Investment-Grade  
**Framework Reference:** `docs/audit/audit-grade-framework.md` §2.3  
**Execution Time:** 4–8 hours  
**Validator:** Self-assessment (AI agent) + external auditor + legal counsel

> **Trigger:** Run this prompt when entering Series B/C, M&A due diligence, or IPO readiness review.

---

## 1. Goal

Determine whether GTCX meets Investment-Grade standards for venture capital, private equity, M&A due diligence, and public listing readiness.

**Pass threshold:** ≥ 8.5/10  
**Prerequisite:** Enterprise-Grade score ≥ 8.5

> **Note:** I.2 (financial audit), I.4 (code audit), I.5 (IP review), and I.6 (forensic accounting) require external validation. AI agent assesses readiness only.

---

## 2. Evidence Collection Commands

### I.1 — All Enterprise-Grade controls (prerequisite)

```bash
# Verify Enterprise-Grade evidence exists
cat docs/audit/prompts/evidence/enterprise-grade-evidence.json 2>/dev/null | jq '.final_score' || echo "Run E-GAP first"
# Verify Enterprise-Grade ≥ 8.5
cat docs/audit/prompts/evidence/enterprise-grade-evidence.json 2>/dev/null | jq '.final_score >= 8.5' || echo "false"
```

**Pass:** Enterprise-Grade ≥ 8.5. If not, abort I-GAP and remediate E-GAP first.

### I.2 — Financial audit (GAAP/IFRS)

```bash
# Check for financial statements
cat docs/financial/audited-financial-statements-*.pdf 2>/dev/null | head -c 100 || echo "No audited financials found"
# Check for CPA engagement letter
find docs/financial/ -name "*engagement*" -o -name "*letter*cpa*" | head -5
# Check for bookkeeping system
grep -ri "quickbooks\|xero\|sage\|netsuite" docs/financial/ || true
```

**Pass:** Audited financials exist OR CPA engagement letter signed.
**Score multiplier:** 0.3 if engagement letter only, 0.7 if draft opinion, 1.0 if unqualified opinion.

### I.3 — Cap table security

```bash
# Check cap table platform
grep -ri "carta\|pulley\|angelist\|equityzen" docs/financial/ docs/legal/ || true
# Check for 2FA enforcement documentation
grep -ri "2fa\|mfa\|two.factor" docs/legal/cap-table* || true
# Check for shareholder agreement
cat docs/legal/shareholder-agreement.md 2>/dev/null | head -30 || echo "No shareholder agreement found"
```

**Pass:** Cap table managed in platform with 2FA. Shareholder agreement exists.

### I.4 — Deep code audit (critical paths)

```bash
# Identify critical paths
grep -r "transfer\|withdraw\|sign\|private.key\|seed" tools/gtcx-platforms/src/ 2>/dev/null | head -10
grep -r "transfer\|withdraw\|sign\|private.key\|seed" tools/gtcx-protocols/src/ 2>/dev/null | head -10
# Check for secrets in code
grep -ri "password\|secret\|key.*=.*['\"]" tools/*/src/ | grep -v "example\|test\|mock" | head -10
# Check SAST in CI
grep -ri "codeql\|snyk\|sonarqube\|semgrep" .github/workflows/ | head -5
```

**Pass:** SAST in CI, no secrets in code, critical paths identified for auditor focus.
**Score multiplier:** 0.5 if SAST only, 1.0 if external code audit report clean.

### I.5 — IP cleanliness review

```bash
# Check LICENSE files
cat LICENSE | head -20
# Check dependency licenses
pnpm licenses list 2>/dev/null | head -20 || echo "Run pnpm licenses list manually"
# Check for proprietary code contamination
grep -ri "copyright\|proprietary\|confidential" tools/*/src/ | grep -v "gtcx" | head -10
# Check for open-source compliance
grep -ri "gpl\|copyleft\|agpl" package.json pnpm-lock.yaml || true
```

**Pass:** All dependencies permissively licensed (MIT, Apache-2.0, BSD). No GPL/AGPL in dependency tree. No third-party proprietary code.

### I.6 — Forensic accounting readiness

```bash
# Check for accounting policies
cat docs/financial/accounting-policies.md 2>/dev/null | head -30 || echo "No accounting policies found"
# Check for related-party transaction policy
grep -ri "related.party\|conflict.*interest" docs/financial/ docs/legal/ | head -10
# Check for expense policy
cat docs/financial/expense-policy.md 2>/dev/null | head -20 || echo "No expense policy found"
```

**Pass:** Accounting policies documented, related-party policy exists, expense policy enforced.

### I.7 — Key-person risk mitigation

```bash
# Check bus factor documentation
grep -ri "bus.factor\|key.person\|succession" docs/ | head -10
# Check documentation coverage
find tools/ -name "*.md" | wc -l
find tools/ -name "README*" | wc -l
# Check runbooks
find docs/devops/ -name "*runbook*" | wc -l
```

**Pass:** Bus factor ≥ 2 documented. README for every major component. Runbooks for critical operations.

### I.8 — Regulatory relationship map

```bash
# Check regulator contacts
cat docs/compliance/regulatory-contacts.md 2>/dev/null | head -30 || echo "No regulatory contacts found"
# Check for enforcement actions
grep -ri "enforcement\|fine\|penalty\|cease" docs/compliance/ docs/legal/ | head -10
# Check for license status
grep -ri "license\|registered\|authorized" docs/compliance/ | head -10
```

**Pass:** All regulator contacts documented, no enforcement actions, licenses current.

### I.9 — Customer concentration risk

```bash
# Check revenue analytics
cat docs/financial/revenue-analytics.md 2>/dev/null | head -30 || echo "No revenue analytics found"
# Check for customer concentration policy
grep -ri "concentration\|diversification\|single.customer" docs/financial/ | head -10
```

**Pass:** No single customer > 30% revenue. Diversification strategy documented.

### I.10 — ESG baseline

```bash
# Check for carbon footprint
cat docs/esg/carbon-footprint.md 2>/dev/null | head -20 || echo "No carbon footprint data"
# Check diversity metrics
grep -ri "diversity\|inclusion\|gender\|demographics" docs/hr/ docs/esg/ | head -10
# Check governance board
cat docs/governance/board-charter.md 2>/dev/null | head -30 || echo "No board charter found"
```

**Pass:** ESG policy exists, carbon baseline calculated, governance board documented.

---

## 3. Scoring Rubric

| Control                     | Weight | Pass Criteria                         | Evidence                | External? |
| --------------------------- | ------ | ------------------------------------- | ----------------------- | --------- |
| I.1 Enterprise prerequisite | 10%    | E-Score ≥ 8.5                         | E-GAP evidence          | ❌ No     |
| I.2 Financial audit         | 20%    | Unqualified opinion                   | CPA letter              | ✅ Yes    |
| I.3 Cap table security      | 10%    | Platform + 2FA + agreement            | Platform screenshot     | ❌ No     |
| I.4 Code audit              | 15%    | 0 critical, ≤2 high                   | AppSec report           | ✅ Yes    |
| I.5 IP cleanliness          | 10%    | All deps permissive, no contamination | License scan            | ❌ No     |
| I.6 Forensic accounting     | 10%    | Policies documented, books clean      | Policy docs, CPA review | ✅ Yes    |
| I.7 Key-person risk         | 5%     | Bus factor ≥ 2, runbooks exist        | Documentation count     | ❌ No     |
| I.8 Regulatory map          | 5%     | Contacts documented, no enforcement   | Compliance doc          | ❌ No     |
| I.9 Customer concentration  | 5%     | No customer > 30%                     | Revenue analytics       | ❌ No     |
| I.10 ESG baseline           | 10%    | Policy, carbon, governance            | ESG docs                | ❌ No     |

**Preliminary Score = Σ(control_score × weight) × 10**  
**Final Score = Preliminary × 0.6 if any external control incomplete**

---

## 4. Output Format

Produce a JSON file at `docs/audit/prompts/evidence/investment-grade-evidence.json`:

```json
{
  "grade": "Investment-Grade",
  "date": "2026-05-10",
  "version": "1.0",
  "prerequisite_met": true,
  "preliminary_score": 0.0,
  "final_score": 0.0,
  "status": "ready|not-ready|pending-external",
  "threshold": 8.5,
  "funding_round": "Series B",
  "external_dependencies": [
    {
      "control": "I.2",
      "status": "pending",
      "blocker": "CPA not engaged",
      "estimated_cost": "$20000-40000"
    }
  ],
  "controls": [...],
  "recommendations": [],
  "dd_readiness": "red|yellow|green",
  "next_review": "per-funding-round"
}
```

---

## 5. Failure Modes

| Scenario                   | Action                                               |
| -------------------------- | ---------------------------------------------------- |
| I.1 prerequisite fails     | Abort I-GAP. Run E-GAP first.                        |
| I.2 no CPA engaged         | Block fundraising timeline 6–8 weeks for audit       |
| I.4 secrets in code        | HALT fundraising — immediate remediation required    |
| I.5 GPL in dependency tree | Legal review required, may require re-implementation |
| I.6 books not audit-ready  | Delay fundraise 3–6 months                           |
| Score < 8.5                | Downround risk. Remediate before term sheet.         |

---

## 6. Related Documents

- `docs/audit/audit-grade-framework.md` §2.3
- `docs/audit/prompts/enterprise-grade-audit-prompt.md`
- `docs/compliance/soc2-gap-analysis.md`
- `docs/legal/shareholder-agreement.md`
