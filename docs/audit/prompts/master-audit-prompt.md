---
title: 'Master Audit Orchestration Prompt'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'chief-auditor'
tier: 'critical'
tags: ['audit-prompt', 'master', 'orchestration', 'all-grades']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Master Audit Orchestration Prompt (MAOP)

**Version:** 1.0  
**Date:** 2026-05-10  
**Auditor:** Kimi Code CLI (Kimi k1.6)  
**Scope:** All five audit grades — Partnership, Enterprise, Investment, Bank, Government  
**Execution Time:** 12–24 hours (full suite)

---

## 1. Goal

Execute the complete GTCX audit grade assessment across all five tiers. Produce a unified scorecard, identify the highest grade currently achievable, and generate a prioritized remediation roadmap.

**Output:** `docs/audit/master-audit-report-YYYY-MM-DD.md`  
**Evidence Directory:** `docs/audit/prompts/evidence/`

---

## 2. Execution Order

Audit grades MUST be assessed in dependency order. Each grade is a prerequisite for the next.

```
Phase 1: Partnership-Grade Audit (P-GAP)
  └─→ If score < 8.0: HALT. No higher grade possible.

Phase 2: Enterprise-Grade Audit (E-GAP)
  └─→ Requires P-GAP ≥ 8.0
  └─→ If score < 8.5: HALT higher grades. Remediate Enterprise first.

Phase 3: Investment-Grade Audit (I-GAP)
  └─→ Requires E-GAP ≥ 8.5
  └─→ If score < 8.5: Note as funding blocker.

Phase 4: Bank-Grade Audit (B-GAP)
  └─→ Requires E-GAP ≥ 8.5
  └─→ If score < 9.0: No banking partnerships possible.

Phase 5: Government-Grade Audit (G-GAP)
  └─→ Requires B-GAP ≥ 9.0
  └─→ If score < 9.5: No sovereign contracts possible.
```

---

## 3. Phase Execution Protocol

For each phase:

1. **Load the prompt**

   ```bash
   cat docs/audit/prompts/<grade>-grade-audit-prompt.md
   ```

2. **Execute evidence collection**
   - Run all commands in the prompt's §2
   - Capture raw output to `docs/audit/prompts/evidence/raw/<grade>-<timestamp>.log`

3. **Score each control**
   - Use the rubric in the prompt's §3
   - Record pass/fail with evidence snippets

4. **Calculate grade score**
   - Apply weights
   - Apply external dependency multiplier
   - Round to one decimal place

5. **Produce evidence JSON**
   - Write to `docs/audit/prompts/evidence/<grade>-grade-evidence.json`
   - Include all raw output references

6. **Gate check**
   - If score < threshold: STOP. Do not proceed to next phase.
   - Generate remediation ticket with priority = P0.

---

## 4. Unified Scorecard Generation

After all phases complete (or halt), generate the master scorecard:

```json
{
  "audit_date": "2026-05-10",
  "auditor": "Kimi Code CLI",
  "version": "1.0",
  "grades": {
    "partnership": {
      "score": 8.5,
      "status": "pass",
      "threshold": 8.0,
      "evidence_file": "partnership-grade-evidence.json"
    },
    "enterprise": {
      "score": 4.5,
      "status": "fail",
      "threshold": 8.5,
      "evidence_file": "enterprise-grade-evidence.json",
      "blockers": ["E.1: SOC 2 Type I pending", "E.2: Pen-test not started"]
    },
    "investment": {
      "score": null,
      "status": "skipped",
      "reason": "Enterprise-Grade prerequisite not met"
    },
    "bank": {
      "score": null,
      "status": "skipped",
      "reason": "Enterprise-Grade prerequisite not met"
    },
    "government": {
      "score": null,
      "status": "skipped",
      "reason": "Bank-Grade prerequisite not met"
    }
  },
  "highest_achievable_grade": "Partnership-Grade",
  "commercial_unlocks": ["API partners", "SaaS integrations", "Revenue-share agreements"],
  "blocked_unlocks": [
    {
      "grade": "Enterprise-Grade",
      "unlocks": ["Fortune 500 contracts", "$100K-5M ACV"],
      "primary_blocker": "SOC 2 Type I + pen-test"
    }
  ],
  "remediation_priority": [
    {
      "priority": "P0",
      "item": "Send pen-test RFP to SensePost",
      "unblocks": "Enterprise-Grade",
      "owner": "Leadership",
      "eta": "2026-06-15"
    },
    {
      "priority": "P0",
      "item": "Select SOC 2 Type I auditor",
      "unblocks": "Enterprise-Grade",
      "owner": "CISO + Finance",
      "eta": "2026-07-01"
    }
  ],
  "next_master_audit": "2026-08-10"
}
```

---

## 5. Remediation Roadmap Generation

For each failed or skipped grade, generate a remediation roadmap:

### Template

```markdown
## <Grade> Remediation Roadmap

**Current Score:** X.X/10  
**Target Score:** Y.Y/10  
**Gap:** Z.Z points

### Critical Path (must happen in order)

1. [ ] <Control ID>: <Action>
   - Owner: <name>
   - Budget: $<amount>
   - ETA: <date>
   - Evidence needed: <file>

### Parallel Workstreams

- Legal: <items>
- Engineering: <items>
- Finance: <items>
- External: <auditor engagements>

### Success Criteria

- [ ] All controls pass
- [ ] Evidence uploaded to `docs/audit/prompts/evidence/`
- [ ] External validation received (if applicable)
- [ ] Re-run <grade>-GAP and score ≥ threshold
```

---

## 6. Quality Gates

Before declaring the master audit complete, verify:

| Gate | Check                                          | Tool                    |
| ---- | ---------------------------------------------- | ----------------------- |
| QG.1 | All evidence JSON files are valid JSON         | `jq empty`              |
| QG.2 | All evidence files reference existing raw logs | `ls`                    |
| QG.3 | No secrets in any evidence file                | `trufflehog filesystem` |
| QG.4 | Score arithmetic is correct                    | Manual recalculation    |
| QG.5 | All blockers have owners and ETAs              | Manual review           |
| QG.6 | Master report is committed to git              | `git log`               |

---

## 7. Output Artifacts

| Artifact             | Path                                                 | Format   |
| -------------------- | ---------------------------------------------------- | -------- |
| Master audit report  | `docs/audit/master-audit-report-YYYY-MM-DD.md`       | Markdown |
| Unified scorecard    | `docs/audit/prompts/evidence/unified-scorecard.json` | JSON     |
| Grade evidence (×5)  | `docs/audit/prompts/evidence/*-grade-evidence.json`  | JSON     |
| Raw logs             | `docs/audit/prompts/evidence/raw/*.log`              | Text     |
| Remediation roadmaps | `docs/audit/remediation-roadmap-*.md`                | Markdown |
| Executive summary    | `docs/audit/executive-summary-YYYY-MM-DD.md`         | Markdown |

---

## 8. Related Documents

- `docs/audit/audit-grade-framework.md` — Five-tier grade definitions
- `docs/audit/bank-grade-rating-framework.md` — Internal vs external dual-rating
- `docs/audit/prompts/partnership-grade-audit-prompt.md`
- `docs/audit/prompts/enterprise-grade-audit-prompt.md`
- `docs/audit/prompts/investment-grade-audit-prompt.md`
- `docs/audit/prompts/bank-grade-audit-prompt.md`
- `docs/audit/prompts/government-grade-audit-prompt.md`
