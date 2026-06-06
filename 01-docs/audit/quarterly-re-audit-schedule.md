---
title: 'Quarterly Re-Audit Schedule'
status: 'current'
date: '2026-05-27'
owner: 'infrastructure-security-team'
role: 'infrastructure-security-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'audit', 'governance']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Quarterly Re-Audit Schedule

**Classification:** Internal  
**Effective Date:** 2026-Q2  
**Next Audit:** 2026-08-17 (Q2 → Q3 boundary)  
**Owner:** Infrastructure Security Team  
**Stakeholders:** CISO, Platform Engineering, Compliance, Executive

---

## Purpose

GTCX operates a continuous audit model. Rather than a single annual point-in-time assessment, we conduct **quarterly re-audits** that verify:

1. No regression in scored dimensions
2. All prior findings are remediated or risk-accepted with board approval
3. New controls and infrastructure changes are evidenced
4. External validation artifacts (pen-test, SOC 2) remain current

This schedule satisfies the M4 exit criterion: **"Quarterly re-audit scheduled."**

---

## Audit Calendar (2026–2028)

| Quarter     | Window    | Focus                                 | Lead                   | Deliverable                     |
| ----------- | --------- | ------------------------------------- | ---------------------- | ------------------------------- |
| **2026-Q2** | May 10–17 | Baseline re-audit post-M3             | Kimi Code CLI          | `master-audit-2026-05-17.md` ✅ |
| **2026-Q3** | Aug 10–17 | Pen-test findings closure check       | Security + Platform    | `master-audit-2026-08-17.md`    |
| **2026-Q4** | Nov 10–17 | SOC 2 Type 1 readiness verification   | Compliance + Security  | `master-audit-2026-11-17.md`    |
| **2027-Q1** | Feb 10–17 | Post-SOC 2 attestation validation     | CISO + Auditor         | `master-audit-2027-02-17.md`    |
| **2027-Q2** | May 10–17 | Annual deep audit + red team evidence | Security + External    | `master-audit-2027-05-17.md`    |
| **2027-Q3** | Aug 10–17 | mTLS mesh operational validation      | Platform Engineering   | `master-audit-2027-08-17.md`    |
| **2027-Q4** | Nov 10–17 | Bug bounty program health check       | Security               | `master-audit-2027-11-17.md`    |
| **2028-Q1** | Feb 10–17 | Full 10.0 score verification          | Executive + Compliance | `master-audit-2028-02-17.md`    |

---

## Quarterly Audit Checklist

### Pre-Audit (Week -2)

- [ ] Freeze infrastructure changes (code freeze 48h before audit)
- [ ] Run full CI validation: `pnpm test`, `pnpm lint`, `pnpm typecheck`
- [ ] Run all policy validators:
  - [ ] `node 03-platform/tools/scripts/kyverno-policy-validator.mjs`
  - [ ] `node 03-platform/tools/scripts/validate-score-ledger.mjs`
  - [ ] `node 03-platform/tools/scripts/validate-signal.mjs`
  - [ ] `node 03-platform/tools/scripts/docs-standard-validator.mjs`
- [ ] Generate fresh release evidence: `node 03-platform/tools/control-plane/generate-release-evidence.mjs`
- [ ] Verify anomaly detector is operational (last 7 days of alerts)
- [ ] Confirm on-call drill executed within last 90 days
- [ ] Review open P0/P1 findings from prior audit

### Audit Execution (Week 0)

- [ ] Recompute all dimension scores using `score-evidence-ledger.json`
- [ ] Verify no score regression without reproducible artifact
- [ ] Inspect Terraform plan drift in testnet-pilot
- [ ] Run `terraform test` across all modules
- [ ] Verify Docker reproducible builds: `pnpm build:reproducible`
- [ ] Check branch coverage gate: `pnpm test:coverage:gate`
- [ ] Validate Kustomize builds for all overlays
- [ ] Confirm WORM audit storage integrity (hash chain)
- [ ] Review pen-test/SOC 2 artifact expiration dates

### Post-Audit (Week +1)

- [ ] Publish `master-audit-YYYY-MM-DD.md`
- [ ] Update `score-evidence-ledger.json` with new entries
- [ ] Archive prior audit to `01-docs/05-audit/archive/`
- [ ] Board briefing (if score changed >0.5 or new P0 found)
- [ ] Open remediation tickets for any new findings
- [ ] Update this schedule with next quarter's details

---

## Evidence Retention

| Artifact                 | Retention | Location                                                |
| ------------------------ | --------- | ------------------------------------------------------- |
| Master audit reports     | 7 years   | `01-docs/05-audit/archive/`                             |
| Score evidence ledger    | 7 years   | `01-docs/05-audit/score-evidence-ledger.json`           |
| CI build artifacts       | 90 days   | GitHub Actions                                          |
| Release evidence bundles | 7 years   | `04-ship/security/reports/release-evidence/`            |
| Pen-test reports         | 7 years   | `01-docs/05-audit/pen-test-report-YYYY-MM-DD.md`        |
| SOC 2 reports            | 7 years   | `01-docs/10-compliance/soc2-type1-attestation-YYYY.pdf` |
| On-call drill evidence   | 3 years   | `01-docs/devops/drills/`                                |
| Kyverno audit events     | 1 year    | CloudWatch Logs                                         |

---

## Escalation Criteria

Escalate to CISO + Executive immediately if any of the following are found during re-audit:

1. **New P0 finding** (unresolved critical security gap)
2. **Score regression >1.0** in any dimension without documented rationale
3. **Prior P0/P1 finding reopened** (regression in remediation)
4. **External validation expired** (pen-test >12 months old, SOC 2 >12 months old)
5. **Anomaly detector silent >7 days** (no alerts when alerts expected)

---

## Automation

The following checks run automatically in CI on every merge to `main`. They do not replace the quarterly re-audit but provide continuous assurance between audits:

- Score ledger validation (`validate-score-ledger.mjs`)
- SIGNAL scorecard validation (`validate-signal.mjs`)
- Kyverno policy validation (`kyverno-policy-validator.mjs`)
- Docs-standard validation (`docs-standard-validator.mjs`)
- Branch coverage gate (`test:coverage:gate`)
- Terraform format + validate (all modules)
- Kustomize build validation (all overlays)

---

## References

- Master audit methodology: `01-docs/05-audit/master-audit-2026-05-17.md`
- Score evidence ledger: `01-docs/05-audit/score-evidence-ledger.json`
- SIGNAL scorecard: `01-docs/05-audit/signal-scorecard.json`
- Remediation plan: `01-docs/05-audit/remediation-plan-10-10-2026.md`
- SOC 2 readiness: `01-docs/10-compliance/soc2-readiness-checklist.md`
