---
title: 'SOC 2 Evidence Pipeline (Compliance API)'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# SOC 2 Evidence Pipeline (Compliance API)

**Owner**: Security + Platform
**Scope**: Compliance API (Gateway)
**Goal**: Standardize evidence collection for SOC 2 Type II readiness.

---

## Evidence Sources

1. **Audit Events**
   - Source: `audit_events` table (hashed chain)
   - Coverage: credential issuance/revocation, scoring, assessment actions
   - Export: `scripts/compliance/export-audit-events.sh`

2. **Access Controls**
   - Source: OAuth client registry, internal service tokens, org isolation tests
   - Evidence: config snapshots + auth middleware tests

3. **Change Management**
   - Source: Git history + release notes
   - Evidence: tagged commits, PR review logs, changelogs

4. **Monitoring + Alerting**
   - Source: Prometheus + Grafana dashboards
   - Evidence: dashboard export + alert rules snapshots

5. **Vulnerability Management**
   - Source: dependency scans + audit logs
   - Evidence: `pnpm audit`, SAST reports

---

## Audit Log Export

Export all audit events (optionally filter by org):

```bash
ORG_ID=00000000-0000-0000-0000-000000000999 \
  scripts/compliance/export-audit-events.sh
```

Defaults:

- Output directory: `/tmp/compliance-os-evidence`
- Output format: CSV

---

## Evidence Manifest

Generate a SHA-256 manifest of all evidence files:

```bash
EVIDENCE_DIR=/tmp/compliance-os-evidence \
  scripts/compliance/generate-evidence-manifest.sh
```

## Evidence Bundle

Export audit events + manifest in one step:

```bash
ORG_ID=00000000-0000-0000-0000-000000000999 \
  scripts/compliance/export-evidence-bundle.sh
```

## Evidence Retention

- Audit events: 7 years
- Change management: 7 years
- Security scans: 3 years
- Incident postmortems: 7 years

---

## Storage

Store evidence exports in the centralized compliance evidence vault:

- `SOC2/Compliance-API/<YYYY>/<MM>/`

---

## Next Steps

1. Automate exports via scheduled job.
2. Automate evidence archive uploads to the SOC2 evidence vault.
3. Attach evidence to SOC 2 control mapping (CC6.x, CC7.x, CC8.x).
