---
title: 'Government-Grade Audit Prompt'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'security-assessor'
tier: 'critical'
tags: ['audit-prompt', 'government-grade', 'automated-assessment']
review_cycle: 'annual'
---

# Government-Grade Audit Prompt (G-GAP)

**Version:** 1.0  
**Target Grade:** Government-Grade  
**Framework Reference:** `docs/audit/audit-grade-framework.md` §2.5  
**Execution Time:** 8–16 hours  
**Validator:** Self-assessment (AI agent) + 3PAO + government security clearance + legal counsel

> **Trigger:** Run this prompt when pursuing sovereign contracts, CBDC infrastructure, national payment switches, SITA frameworks, or defense-adjacent projects.

---

## 1. Goal

Determine whether GTCX meets Government-Grade security standards for sovereign contracts, central bank digital currency (CBDC), national ID systems, and critical infrastructure.

**Pass threshold:** ≥ 9.5/10  
**Prerequisite:** Bank-Grade score ≥ 9.0

> **Note:** G.2 (SITA/FedRAMP), G.3 (FIPS 140-2 L3), G.5 (clearance), G.9 (24/7 SOC), and G.10 (zero-trust validation) require external validation. AI agent assesses readiness only.

---

## 2. Evidence Collection Commands

### G.1 — All Bank-Grade controls (prerequisite)

```bash
# Verify Bank-Grade evidence exists
cat docs/audit/prompts/evidence/bank-grade-evidence.json 2>/dev/null | jq '.final_score' || echo "Run B-GAP first"
# Verify Bank-Grade ≥ 9.0
cat docs/audit/prompts/evidence/bank-grade-evidence.json 2>/dev/null | jq '.final_score >= 9.0' || echo "false"
```

**Pass:** Bank-Grade ≥ 9.0. If not, abort G-GAP and remediate B-GAP first.

### G.2 — FedRAMP Moderate (or SITA equivalent)

```bash
# Check for SITA framework agreement
cat docs/compliance/sita-framework.md 2>/dev/null | head -40 || echo "No SITA framework doc"
# Check for 3PAO engagement
find docs/compliance/ -name "*3pao*" -o -name "*assessment*org*" | head -5
# Check for System Security Plan (SSP)
cat docs/compliance/ssp-fedramp.md 2>/dev/null | head -40 || echo "No SSP"
# Check for control implementation evidence
find docs/compliance/ -name "*control*" | wc -l
```

**Pass:** SSP documented, 3PAO engaged, control evidence for all 325 FedRAMP Moderate controls (or SITA equivalent).
**Score multiplier:** 0.0 if no SSP, 0.5 if 3PAO assessment in progress, 1.0 if ATO received.

### G.3 — FIPS 140-2 Level 3 (or Level 2 with HSM)

```bash
# Check for FIPS 140-2 compliance documentation
cat docs/compliance/fips140-2-assessment.md 2>/dev/null | head -40 || echo "No FIPS assessment"
# Check KMS key specs for FIPS
aws kms describe-key --key-id alias/gtcx-production-signing --query 'KeyMetadata.CustomerMasterKeySpec' 2>/dev/null || echo "Check KMS key spec manually"
# Check for HSM backing
grep -ri "hsm\|cloudhsm\|hardware" infra/terraform/modules/kms-signing/ | head -5
# Check for CMVP certificate
find docs/compliance/ -name "*cmvp*" -o -name "*certificate*" | head -5
```

**Pass:** All cryptographic operations use FIPS 140-2 validated modules. Level 3 for key generation, Level 2 minimum for all other operations.
**Score multiplier:** 0.5 if Level 2, 1.0 if Level 3.

### G.4 — Supply chain SBOM + attestation

```bash
# Check for SBOM generation in CI
grep -ri "sbom\|spdx\|cyclonedx\|syft" .github/workflows/ | head -10
# Check for existing SBOMs
find . -name "*.spdx.json" -o -name "*sbom*" | head -10
# Check for dependency pinning
grep -ri "immutable\|sha256\|digest" .github/workflows/ | head -5
# Check for artifact signing
grep -ri "cosign\|notation\|sigstore" .github/workflows/ | head -5
```

**Pass:** SBOM generated for every build, signed artifacts, immutable dependencies.

### G.5 — Citizenship / security clearance for critical roles

```bash
# Check for personnel security policy
cat docs/hr/personnel-security-policy.md 2>/dev/null | head -40 || echo "No personnel security policy"
# Check for clearance requirements in job descriptions
grep -ri "clearance\|citizenship\|security.check" docs/hr/ | head -10
# Check for background check process
grep -ri "background.check\|vetting\|screening" docs/hr/ | head -10
```

**Pass:** Personnel security policy exists, critical roles require SA citizenship + security clearance, background checks completed.
**Score multiplier:** 0.5 if policy exists, 1.0 if clearances obtained for critical roles.

### G.6 — Data sovereignty (no cross-border without MoU)

```bash
# Check for data localization architecture
cat docs/architecture/data-localization.md 2>/dev/null | head -40 || echo "No data localization doc"
# Verify all production in af-south-1
grep -r "af-south-1" infra/terraform/environments/production/*.tf | wc -l
# Check for cross-border transfer policy
grep -ri "cross.border\|transfer\|mou\|adequacy" docs/compliance/ | head -10
```

**Pass:** All production data in af-south-1. Cross-border transfer requires MoU. POPIA compliance verified.

### G.7 — Air-gapped deployment option

```bash
# Check for air-gapped architecture
cat docs/architecture/air-gapped-deployment.md 2>/dev/null |head -40 || echo "No air-gapped doc"
# Check for offline-capable builds
grep -ri "offline\|airgap\|disconnected" docs/architecture/ infra/docker/ | head -10
# Check for container registry mirroring
grep -ri "mirror\|registry.*proxy\|harbor" infra/kubernetes/ docs/devops/ | head -5
```

**Pass:** Air-gapped architecture documented, offline build tested, container registry mirroring configured.

### G.8 — 99.99% uptime SLA (52.6m downtime/year)

```bash
# Check for multi-region architecture
grep -ri "multi.region\|failover\|dr\|disaster" docs/architecture/ | head -10
# Check for historical uptime
cat docs/audit/uptime-evidence-*.md 2>/dev/null | head -30 || echo "No uptime evidence"
# Check for redundant region
grep -r "region" infra/terraform/environments/production/main.tf | head -10
```

**Pass:** Multi-region or hot-standby documented, historical evidence supports 99.99%, redundant region configured.

### G.9 — Continuous monitoring + SIEM

```bash
# Check for 24/7 SOC documentation
cat docs/devops/soc-operations.md 2>/dev/null | head -40 || echo "No SOC ops doc"
# Check for SIEM integration
grep -ri "siem\|splunk\|elastic\|sentinel\|sumo" infra/monitoring/ docs/devops/ | head -10
# Check for threat intel feeds
grep -ri "threat.intel\|ioc\|feeds\|misp" docs/devops/ infra/monitoring/ | head -5
# Check for MTTR metrics
grep -ri "mttr\|mean.time\|response.time" docs/devops/ | head -5
```

**Pass:** 24/7 SOC documented, SIEM integrated, threat intel feeds active, MTTR < 1 hour.

### G.10 — Zero-trust architecture (mTLS, micro-segmentation)

```bash
# Check for mTLS mesh
grep -ri "linkerd\|istio\|mTLS\|mutual.tls" infra/kubernetes/ docs/architecture/ | head -10
# Check for NetworkPolicy
grep -ri "NetworkPolicy\|network.policy" infra/kubernetes/ | head -5
# Check for micro-segmentation
grep -ri "segmentation\|zero.trust\|ztna" docs/architecture/ | head -5
# Check for service mesh sidecar injection
grep -ri "sidecar\|injection" infra/kubernetes/ | head -5
```

**Pass:** Service mesh with mTLS deployed, NetworkPolicies enforce micro-segmentation, zero-trust architecture documented.
**Score multiplier:** 0.5 if planned/configured, 1.0 if operational + red team validated.

### G.11 — King IV governance compliance

```bash
# Check for King IV compliance framework
cat docs/governance/king-iv-compliance.md 2>/dev/null | head -40 || echo "No King IV doc"
# Check for board charter
cat docs/governance/board-charter.md 2>/dev/null | head -30 || echo "No board charter"
# Check for ethics policy
cat docs/governance/ethics-policy.md 2>/dev/null | head -30 || echo "No ethics policy"
# Check for audit committee
cat docs/governance/audit-committee-terms.md 2>/dev/null | head -30 || echo "No audit committee terms"
```

**Pass:** Board charter exists, ethics policy published, audit committee formed, King IV principles mapped.

### G.12 — POPIA + FICA + PAIA compliance

```bash
# Check for POPIA registration
cat docs/compliance/popia-registration.md 2>/dev/null | head -30 || echo "No POPIA registration doc"
# Check for ROPA (Record of Processing Activities)
cat docs/compliance/popia-ropa.md 2>/dev/null | head -40 || echo "No ROPA"
# Check for breach notification process
cat docs/compliance/popia-breach-notification.md 2>/dev/null | head -30 || echo "No breach notification process"
# Check for FICA compliance
cat docs/compliance/fica-compliance.md 2>/dev/null | head -40 || echo "No FICA compliance doc"
# Check for PAIA manual
cat docs/compliance/paia-manual.md 2>/dev/null | head -40 || echo "No PAIA manual"
```

**Pass:** POPIA registered, ROPA complete, breach notification process tested, FICA operational, PAIA manual published.

---

## 3. Scoring Rubric

| Control                | Weight | Pass Criteria                                  | Evidence                  | External? |
| ---------------------- | ------ | ---------------------------------------------- | ------------------------- | --------- |
| G.1 Bank prerequisite  | 8%     | B-Score ≥ 9.0                                  | B-GAP evidence            | ❌ No     |
| G.2 SITA/FedRAMP       | 15%    | ATO from 3PAO                                  | ATO letter                | ✅ Yes    |
| G.3 FIPS 140-2 L3      | 12%    | CMVP certificate                               | Certificate               | ✅ Yes    |
| G.4 SBOM + attestation | 8%     | SPDX/CycloneDX per build, signed               | SBOMs, CI config          | ❌ No     |
| G.5 Clearance          | 8%     | SA citizenship + clearance for critical roles  | Clearance letters         | ✅ Yes    |
| G.6 Data sovereignty   | 8%     | af-south-1 only, MoU for cross-border          | Architecture, contracts   | ❌ No     |
| G.7 Air-gapped         | 8%     | Architecture doc, tested offline replica       | Test evidence             | ❌ No     |
| G.8 99.99% uptime      | 7%     | Multi-region, historical evidence              | Uptime reports            | ❌ No     |
| G.9 24/7 SOC + SIEM    | 10%    | SOC operational, SIEM integrated, MTTR < 1h    | SOC docs, SIEM config     | ✅ Yes    |
| G.10 Zero-trust        | 8%     | mTLS mesh + NetworkPolicy + red team validated | Architecture, test report | ✅ Yes    |
| G.11 King IV           | 4%     | Board charter, ethics, audit committee         | Governance docs           | ❌ No     |
| G.12 POPIA/FICA/PAIA   | 4%     | Registered, ROPA, breach process, PAIA manual  | Compliance docs           | ❌ No     |

**Preliminary Score = Σ(control_score × weight) × 10**  
**Final Score = Preliminary × 0.6 if any external control incomplete**

---

## 4. Output Format

Produce a JSON file at `docs/audit/prompts/evidence/government-grade-evidence.json`:

```json
{
  "grade": "Government-Grade",
  "date": "2026-05-10",
  "version": "1.0",
  "prerequisite_met": true,
  "preliminary_score": 0.0,
  "final_score": 0.0,
  "status": "ready|not-ready|pending-external",
  "threshold": 9.5,
  "jurisdiction": "ZA",
  "contract_type": "SITA|CBDC|NationalPayment|Defense",
  "external_dependencies": [
    {
      "control": "G.2",
      "status": "pending",
      "blocker": "SITA framework not yet engaged",
      "estimated_timeline": "2027"
    }
  ],
  "controls": [...],
  "recommendations": [],
  "government_readiness": "red|yellow|green",
  "next_review": "2027-05-10"
}
```

---

## 5. Failure Modes

| Scenario                              | Action                                                     |
| ------------------------------------- | ---------------------------------------------------------- |
| G.1 prerequisite fails                | Abort G-GAP. Run B-GAP first.                              |
| G.2 No SITA engagement                | Cannot bid on government procurement                       |
| G.3 FIPS 140-2 fails                  | Cannot handle classified or sensitive government data      |
| G.5 Foreign national on critical path | Restructure team or apply for exception                    |
| G.9 No 24/7 SOC                       | Government will not award critical infrastructure contract |
| G.10 Red team breaches zero-trust     | Redesign network segmentation, re-test                     |
| Score < 9.5                           | Government contract rejected. No sovereign work possible.  |

---

## 6. Clearance Levels (South Africa)

| Level        | Access                          | GTCX Requirement             |
| ------------ | ------------------------------- | ---------------------------- |
| Confidential | Sensitive non-national security | All engineering staff        |
| Secret       | National security matters       | Senior engineers, architects |
| Top Secret   | Highest classification          | CISO, CTO, select principals |

---

## 7. Related Documents

- `docs/audit/audit-grade-framework.md` §2.5
- `docs/audit/prompts/bank-grade-audit-prompt.md`
- `docs/governance/king-iv-compliance.md`
- `docs/compliance/popia-registration.md`
- `docs/compliance/fica-compliance.md`
