---
title: 'Partnership-Grade Audit Prompt'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'security-assessor'
tier: 'critical'
tags: ['audit-prompt', 'partnership-grade', 'automated-assessment']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Partnership-Grade Audit Prompt (P-GAP)

**Version:** 1.0  
**Target Grade:** Partnership-Grade  
**Framework Reference:** `01-docs/05-audit/audit-grade-framework.md` §2.1  
**Execution Time:** 15–30 minutes  
**Validator:** Self-assessment (AI agent)

---

## 1. Goal

Determine whether GTCX meets Partnership-Grade security standards for API integrators, SaaS partners, and non-critical data sharing relationships.

**Pass threshold:** ≥ 8.0/10  
**Current target:** 8.5/10

---

## 2. Evidence Collection Commands

Execute all commands. Capture output. Each command maps to a control.

### P.1 — HTTPS-only API endpoints

```bash
# Verify TLS 1.3 on all public endpoints
nmap --script ssl-enum-ciphers -p 443 api.gtcx.trade 2>/dev/null || echo "nmap not available"
curl -s -o /dev/null -w "%{http_code}\n" http://api.gtcx.trade || true
curl -s -o /dev/null -w "%{http_code}\n" https://api.gtcx.trade || true
```

**Pass:** HTTP returns 301/308 to HTTPS. HTTPS returns 200. TLS 1.3 available.

### P.2 — API authentication

```bash
# Check that unauthenticated requests are rejected
curl -s -w "\n%{http_code}" https://api.gtcx.trade/v1/health || true
# Check auth middleware exists in codebase
grep -r "auth" 03-platform/tools/compliance-gateway/03-platform/src/ | grep -i "middleware\|verify\|validate" | head -5
```

**Pass:** 401/403 on missing auth. Auth middleware present in gateway.

### P.3 — Rate limiting

```bash
# Check rate limit configuration
grep -r "rateLimit\|rate_limit\|throttle" 03-platform/tools/compliance-gateway/03-platform/src/ | head -5
grep -r "rateLimit\|rate_limit\|throttle" 04-ship/terraform/modules/waf/ | head -5
```

**Pass:** Rate limiting configured in gateway OR WAF.

### P.4 — Published security contact

```bash
# Check security.txt
curl -s https://gtcx.trade/.well-known/security.txt | head -10 || true
# Check SECURITY.md
cat SECURITY.md | head -20
```

**Pass:** `security.txt` exists with contact email OR `SECURITY.md` in repo root.

### P.5 — Incident notification SLA (72h)

```bash
# Check incident response documentation
grep -ri "72.*hour\|72h\|notification.*sla" 01-docs/devops/ 01-docs/09-security/ || true
grep -ri "incident.*response\|security.*contact" 01-docs/ | head -5
```

**Pass:** Documented SLA ≤ 72 hours for security incident notification to partners.

### P.6 — No PII storage in partner-facing systems

```bash
# Check partner API schemas for PII fields
grep -ri "ssn\|passport\|id_number\|dob\|birth" 03-platform/tools/compliance-gateway/03-platform/src/ || true
# Check data classification
grep -ri "pii\|sensitive\|classified" 01-docs/architecture/ || true
```

**Pass:** Partner APIs do not expose or store PII. Data classification documented.

### P.7 — Annual self-assessment questionnaire

```bash
# Check for partner assessment template
find 01-docs/ -name "*partner*" -o -name "*assessment*" -o -name "*questionnaire*" | head -10
# Check for vendor security questionnaire response
find 01-docs/ -name "*security*questionnaire*" -o -name "*vendor*assessment*" | head -5
```

**Pass:** Template exists OR previous response exists.

---

## 3. Scoring Rubric

| Control              | Weight | Pass Criteria                           | Evidence Required           |
| -------------------- | ------ | --------------------------------------- | --------------------------- |
| P.1 HTTPS            | 15%    | TLS 1.3, HTTP→HTTPS redirect            | `curl` output, `nmap` scan  |
| P.2 Auth             | 15%    | 401 on missing auth, middleware present | `curl` output, code grep    |
| P.3 Rate limit       | 15%    | Configured in gateway or WAF            | Code grep, WAF rules        |
| P.4 Security contact | 15%    | `security.txt` or `SECURITY.md`         | File contents               |
| P.5 Incident SLA     | 15%    | ≤72h documented                         | Document grep               |
| P.6 No PII           | 15%    | No PII in partner APIs                  | Code grep, architecture doc |
| P.7 Self-assessment  | 10%    | Template or prior response              | File listing                |

**Score = Σ(control_pass × weight) × 10**

---

## 4. Output Format

Produce a JSON file at `01-docs/05-audit/prompts/evidence/partnership-grade-evidence.json`:

```json
{
  "grade": "Partnership-Grade",
  "date": "2026-05-10",
  "version": "1.0",
  "overall_score": 0.0,
  "status": "pass|fail",
  "threshold": 8.0,
  "controls": [
    {
      "id": "P.1",
      "name": "HTTPS-only endpoints",
      "weight": 0.15,
      "passed": true,
      "evidence": "...",
      "raw_output": "..."
    }
  ],
  "recommendations": [],
  "next_review": "2026-08-10"
}
```

---

## 5. Failure Modes

| Scenario                        | Action                                                    |
| ------------------------------- | --------------------------------------------------------- |
| P.1 fails (no TLS 1.3)          | Block all partner onboarding until WAF TLS policy updated |
| P.2 fails (no auth)             | CRITICAL — halt API exposure immediately                  |
| P.4 fails (no security contact) | Create `security.txt` within 24 hours                     |
| Score < 8.0                     | Generate remediation ticket, re-assess in 2 weeks         |

---

## 6. Related Documents

- `01-docs/05-audit/audit-grade-framework.md` §2.1
- `01-docs/05-audit/bank-grade-rating-framework.md`
- `SECURITY.md`
