---
title: 'Enterprise-Grade Audit Prompt'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'security-assessor'
tier: 'critical'
tags: ['audit-prompt', 'enterprise-grade', 'automated-assessment']
review_cycle: 'quarterly'
---

# Enterprise-Grade Audit Prompt (E-GAP)

**Version:** 1.0  
**Target Grade:** Enterprise-Grade  
**Framework Reference:** `docs/audit/audit-grade-framework.md` §2.2  
**Execution Time:** 2–4 hours  
**Validator:** Self-assessment (AI agent) + external auditor validation required

---

## 1. Goal

Determine whether GTCX meets Enterprise-Grade security standards for Fortune 500, multinational corporate, healthcare, and telecom customers handling PII.

**Pass threshold:** ≥ 8.5/10  
**Current target:** 8.5/10

> **Note:** Controls E.1 (SOC 2 Type I) and E.2 (pen-test) require external validation. The AI agent assesses readiness; final score requires auditor sign-off.

---

## 2. Evidence Collection Commands

### E.1 — SOC 2 Type I (or ISO 27001)

```bash
# Check for SOC 2 gap analysis
cat docs/compliance/soc2-gap-analysis.md 2>/dev/null | head -30 || echo "No SOC 2 gap analysis found"
# Check for auditor engagement
grep -ri "soc.*2\|iso.*27001" docs/audit/ | head -10
# Check trust center or compliance page
curl -s https://gtcx.io/trust | grep -i "soc\|iso" | head -5 || true
```

**Pass:** Gap analysis exists AND auditor selected OR Type I in progress.
**Score multiplier:** 0.5 if gap analysis only, 1.0 if opinion letter received.

### E.2 — Annual penetration test

```bash
# Check pen-test scope document
cat docs/audit/pen-test-scope-2026.md | head -20
# Check vendor shortlist
cat docs/audit/pen-test-vendor-shortlist.md | head -20
# Check for historical pen-test reports
find docs/audit/ -name "*pen*test*report*" -o -name "*pentest*" | head -5
```

**Pass:** Scope defined, vendor selected, RFP sent OR report received.
**Score multiplier:** 0.5 if RFP sent, 1.0 if clean report received.

### E.3 — Data residency guarantee

```bash
# Verify AWS region lock
aws configure get region 2>/dev/null || echo "AWS CLI not configured"
# Check Terraform for region constraints
grep -r "af-south-1" infra/terraform/environments/production/main.tf | head -3
grep -r "provider.*aws" infra/terraform/environments/production/main.tf -A 3 | head -10
# Check for data localization contract template
find docs/ -name "*dpa*" -o -name "*data*processing*" -o -name "*residency*" | head -5
```

**Pass:** All production resources in af-south-1. DPA/residency addendum template exists.

### E.4 — Encryption at rest + in transit

```bash
# Check RDS encryption
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,StorageEncrypted]' 2>/dev/null || echo "AWS CLI not available"
# Check S3 default encryption
aws s3api get-bucket-encryption --bucket gtcx-production-cloudtrail-logs 2>/dev/null | grep -i "sse" || echo "Check S3 encryption manually"
# Check KMS key policies
grep -r "kms" infra/terraform/modules/kms-signing/main.tf | head -10
# Check TLS version on endpoints
openssl s_client -connect api.gtcx.io:443 -tls1_3 2>/dev/null | grep "Protocol" || true
```

**Pass:** RDS encrypted, S3 encrypted, KMS policies restrictive, TLS 1.3 enforced.

### E.5 — RBAC with least privilege

```bash
# Run IAM Access Analyzer
grep -r "AccessAnalyzer\|access_analyzer" infra/terraform/ | head -5
# Check IAM policies for wildcard permissions
find infra/terraform/modules/ -name "*.tf" -exec grep -l "Action.*\*" {} \; | head -10
# Check for unused IAM roles
aws iam list-roles --query 'Roles[*].[RoleName,CreateDate]' 2>/dev/null | head -10 || echo "Check IAM roles manually"
# Verify IRSA role has minimal permissions
cat infra/terraform/modules/irsa-platform/main.tf | grep -A 20 "AllowKmsSign"
```

**Pass:** No `*` actions in policies (except root policy). IRSA scoped to specific KMS key. Access Analyzer enabled.

### E.6 — 99.9% uptime SLA

```bash
# Check SLO dashboards exist
find docs/devops/ -name "*slo*" -o -name "*grafana*" | head -5
find infra/monitoring/ -name "*slo*" -o -name "*dashboard*" | head -5
# Check uptime calculation scripts
find tools/ -name "*uptime*" -o -name "*slo*" | head -5
# Check historical uptime evidence
find docs/audit/ -name "*uptime*" -o -name "*availability*" | head -5
```

**Pass:** SLO dashboards defined, burn-rate alerts configured, historical evidence available.

### E.7 — Bug bounty or VDP

```bash
# Check for bug bounty program
curl -s https://gtcx.io/security | grep -i "bug\|bounty\|vdp\|disclosure" | head -5 || true
# Check HackerOne or Bugcrowd
curl -s https://hackerone.com/gtcx | head -5 || true
# Check security page for VDP
cat docs/security/vulnerability-disclosure-policy.md 2>/dev/null | head -20 || echo "No VDP found"
```

**Pass:** Bug bounty live OR VDP published with scope and safe harbor.

### E.8 — Business continuity plan

```bash
# Check BCP documentation
find docs/ -name "*bcp*" -o -name "*business*continuity*" -o -name "*disaster*recovery*" | head -10
# Check RTO/RPO definitions
grep -ri "rto\|rpo\|recovery.*time\|recovery.*point" docs/devops/ | head -10
# Check DR test schedule
find docs/ -name "*dr*test*" -o -name "*drill*" | head -5
```

**Pass:** BCP documented, RTO/RPO defined, DR test scheduled or executed.

### E.9 — Vendor risk assessment passed

```bash
# Check for vendor security questionnaire response
find docs/ -name "*vendor*" -o -name "*questionnaire*" -o -name "*vsa*" | head -10
# Check for security controls matrix
find docs/compliance/ -name "*controls*" -o -name "*matrix*" | head -5
```

**Pass:** Questionnaire response template exists, controls matrix mapped to SOC 2/ISO 27001.

### E.10 — Data deletion certification

```bash
# Check for data retention policy
grep -ri "retention\|deletion\|destruction" docs/compliance/ docs/security/ | head -10
# Check for certificate of destruction template
find docs/ -name "*destruction*" -o -name "*deletion*cert*" | head -5
```

**Pass:** Retention policy documented, destruction certificate template exists.

---

## 3. Scoring Rubric

| Control            | Weight | Pass Criteria                                     | Evidence                      | External? |
| ------------------ | ------ | ------------------------------------------------- | ----------------------------- | --------- |
| E.1 SOC 2 Type I   | 25%    | Opinion letter or gap analysis + auditor selected | Auditor letter / gap analysis | ✅ Yes    |
| E.2 Pen-test       | 25%    | Clean report (0 critical, ≤3 high)                | Pen-test report               | ✅ Yes    |
| E.3 Data residency | 10%    | af-south-1 only, DPA template                     | Terraform, contract           | ❌ No     |
| E.4 Encryption     | 10%    | RDS+S3+KMS encrypted, TLS 1.3                     | AWS CLI, Terraform            | ❌ No     |
| E.5 RBAC           | 10%    | Least privilege, no wildcard actions              | IAM policies, Access Analyzer | ❌ No     |
| E.6 Uptime SLA     | 5%     | 99.9% with dashboards and alerts                  | Grafana, SLO docs             | ❌ No     |
| E.7 Bug bounty/VDP | 5%     | Program live or VDP published                     | URL, policy doc               | ❌ No     |
| E.8 BCP            | 5%     | Documented RTO/RPO, DR tested                     | BCP doc, test evidence        | ❌ No     |
| E.9 Vendor risk    | 3%     | Questionnaire response template                   | Template doc                  | ❌ No     |
| E.10 Data deletion | 2%     | Retention policy, destruction cert                | Policy doc                    | ❌ No     |

**Preliminary Score = Σ(control_score × weight) × 10**  
**Final Score = Preliminary × 0.5 if E.1 or E.2 incomplete**

---

## 4. Output Format

Produce a JSON file at `docs/audit/prompts/evidence/enterprise-grade-evidence.json`:

```json
{
  "grade": "Enterprise-Grade",
  "date": "2026-05-10",
  "version": "1.0",
  "preliminary_score": 0.0,
  "final_score": 0.0,
  "status": "ready|not-ready|pending-external",
  "threshold": 8.5,
  "external_dependencies": [
    {
      "control": "E.1",
      "status": "pending",
      "blocker": "Auditor not selected"
    }
  ],
  "controls": [...],
  "recommendations": [],
  "next_review": "2026-08-10"
}
```

---

## 5. Failure Modes

| Scenario                     | Action                                           |
| ---------------------------- | ------------------------------------------------ |
| E.1 incomplete, no auditor   | Priority 1: Select auditor, begin gap analysis   |
| E.2 incomplete, no vendor    | Priority 1: Send SensePost RFP                   |
| E.4 fails (unencrypted data) | CRITICAL — halt all production data ingestion    |
| E.5 fails (wildcard IAM)     | HIGH — remediate IAM policies within 48 hours    |
| Score < 8.5                  | Block enterprise sales pipeline until remediated |

---

## 6. Related Documents

- `docs/audit/audit-grade-framework.md` §2.2
- `docs/compliance/soc2-gap-analysis.md`
- `docs/audit/pen-test-scope-2026.md`
- `docs/audit/pen-test-vendor-shortlist.md`
