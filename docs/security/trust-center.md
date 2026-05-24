---
title: 'Trust Center — GTCX Compliance Substrate'
status: 'current'
date: '2026-05-24'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'trust', 'external', 'compliance', 'transparency']
review_cycle: 'monthly'
---

# Trust Center — GTCX Compliance Substrate

> **Audience:** External partners, regulators, customers, and security teams evaluating the substrate.
> **Purpose:** Single landing page summarizing every property that determines whether you should trust GTCX with audit-grade evidence.

## What is the GTCX Compliance Substrate?

A tamper-evident audit and policy-enforcement runtime for cross-border commodity trade. Three primitives ([`@gtcx/audit-signer`](https://www.npmjs.com/package/@gtcx/audit-signer), `terraform-aws-compliance-db`, `@gtcx/compliance-gateway-mcp`) compose into a substrate that records every consequential compliance decision, hash-links them cryptographically, and persists them to WORM storage no operator can modify before 7-year retention expires.

Detailed architecture: [`../architecture/system-overview.md`](../architecture/system-overview.md).

## How to verify what we claim

The substrate is designed for **independent verification**. You don't have to trust GTCX; you can verify directly.

| Claim                                               | How to verify                                                                                                                                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit records are cryptographically signed          | Pull an NDJSON batch from the WORM bucket and run `npx -y @gtcx/audit-signer verify --file <batch>` — verifier is open-source npm package                                                             |
| Hash chain is unbroken                              | Same command; reports `valid: true` or `firstInvalidIndex: N`                                                                                                                                         |
| WORM bucket cannot be tampered with                 | AWS Object Lock COMPLIANCE mode applies even to root — see [AWS S3 Object Lock docs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-overview.html)                                 |
| Production gateway fails closed without signing key | See ADR-016: [`../decisions/ADR-016-fail-closed-audit-signing.md`](../decisions/ADR-016-fail-closed-audit-signing.md) — `process.exit(78)` on startup                                                 |
| Per-tenant isolation is structural                  | See ADR-015: [`../decisions/ADR-015-per-tenant-jetstream-subject-routing.md`](../decisions/ADR-015-per-tenant-jetstream-subject-routing.md) — different JetStream subjects + WORM prefixes per tenant |
| 0 critical open security findings                   | See [`../audit/full-audit-2026-05-22.md`](../audit/full-audit-2026-05-22.md)                                                                                                                          |

## Security posture summary

| Dimension                  | Status                                                   | Evidence                                                                                                                  |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Substrate audit score      | 9.60 / 10 (SIGNAL v2)                                    | [`../audit/signal-scorecard.json`](../audit/signal-scorecard.json)                                                        |
| Threat model               | STRIDE — 20 threats categorized                          | [`./threat-model-2026-05.md`](./threat-model-2026-05.md)                                                                  |
| Penetration test           | Engagement RFP sent (4 firms); target 2026-07            | [`../audit/soc2-engagement-2026.md`](../audit/soc2-engagement-2026.md)                                                    |
| Signing-key custody        | AWS KMS CMK; encrypted at rest; rotation 365-day cadence | [`./key-ceremony-runbook.md`](./key-ceremony-runbook.md) + [`./credential-rotation-log.md`](./credential-rotation-log.md) |
| Vulnerability disclosure   | Coordinated VDP published                                | [`./vulnerability-disclosure.md`](./vulnerability-disclosure.md)                                                          |
| Bug bounty                 | Active, scoped to substrate primitives                   | [`./bug-bounty-policy.md`](./bug-bounty-policy.md)                                                                        |
| Signed-commits enforcement | Yes, on `main`                                           | [`./signed-commits-policy.md`](./signed-commits-policy.md)                                                                |
| Container image signing    | Cosign keyless via OIDC                                  | [`./cosign-ci-integration.md`](./cosign-ci-integration.md)                                                                |
| Supply-chain (npm)         | ADR-021 publish discipline; Sigstore provenance planned  | [`../decisions/ADR-021-npm-publish-discipline.md`](../decisions/ADR-021-npm-publish-discipline.md)                        |

Full security posture (technical depth): [`../gtm/01-security-posture.md`](../gtm/01-security-posture.md).

## Compliance posture summary

| Framework         | Status                                                 | Evidence                                                                                               |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| SOC 2 Type 1      | Auditor RFP sent                                       | [`../gtm/02-compliance-matrix.md`](../gtm/02-compliance-matrix.md)                                     |
| SOC 2 Type 2      | Evidence pipeline 70% complete                         | [`../compliance/soc2-evidence-inventory-2026-05.md`](../compliance/soc2-evidence-inventory-2026-05.md) |
| GDPR              | DPIA published                                         | [`../compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md)                                       |
| FIPS 140-3        | FIPS-ready (depends on operator-side runtime build)    | [`../gtm/03-fips-readiness.md`](../gtm/03-fips-readiness.md)                                           |
| ISO 27001 Annex A | Policies drafted A05-A18                               | [`../compliance/policies/`](../compliance/policies/)                                                   |
| NIST SP 800-53    | Mapping drafted (federal-track)                        | [`./nist-800-53-mapping.md`](./nist-800-53-mapping.md)                                                 |
| PCI-DSS           | Out of substrate scope (no CHD in current deployments) | [`../gtm/02-compliance-matrix.md`](../gtm/02-compliance-matrix.md)                                     |

Full framework matrix: [`../gtm/02-compliance-matrix.md`](../gtm/02-compliance-matrix.md).

## Data protection posture

| Property                     | Status                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| Tenant isolation             | Structural — per-tenant JetStream subject + per-tenant WORM prefix (not declarative)      |
| At-rest encryption           | AES-256-GCM, KMS-managed CMK                                                              |
| In-transit encryption        | TLS 1.3                                                                                   |
| Audit data retention         | 2557 days (7 years) under WORM Object Lock COMPLIANCE mode                                |
| Operational data retention   | Per [`../compliance/data-retention-policy.md`](../compliance/data-retention-policy.md)    |
| PII handling                 | Per [`../compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md) DPIA                 |
| Subject access rights (GDPR) | Per [`../compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md) §Data Subject Rights |
| Cross-border transfer        | Substrate runs in-region (operator chooses; ZW pilot is `af-south-1`)                     |

## Operational posture

| Property                      | Status                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| SLOs published                | [`../operations/slo-definitions.md`](../operations/slo-definitions.md)                                               |
| Incident response             | [`../operations/runbooks/incident-response.md`](../operations/runbooks/incident-response.md)                         |
| Audit-chain incident response | [`../operations/runbooks/audit-chain-incident-response.md`](../operations/runbooks/audit-chain-incident-response.md) |
| Disaster recovery             | [`../operations/runbooks/disaster-recovery.md`](../operations/runbooks/disaster-recovery.md)                         |
| On-call coverage              | Cross-region engineering on the substrate primitives                                                                 |
| Post-mortem discipline        | Required for P0 / P1; template in runbooks                                                                           |

## Reporting a security issue

See [`./vulnerability-disclosure.md`](./vulnerability-disclosure.md) for the coordinated disclosure path. Active bug bounty scoping at [`./bug-bounty-policy.md`](./bug-bounty-policy.md). Maximum response time to a triaged P0 report: 24 hours.

## Open security follow-ups (transparent backlog)

We publish our open security work, not just our closed work.

| ID           | Description                                            | Status                           |
| ------------ | ------------------------------------------------------ | -------------------------------- |
| SEC-OPEN-001 | Signed approval tickets for mutating tools             | In progress                      |
| SEC-OPEN-002 | Sigstore / SLSA provenance on npm publishes            | In progress (per ADR-021 rule 4) |
| SEC-OPEN-003 | Linkerd mTLS sidecar at runtime (ADR-013)              | Scheduled Q3 2026                |
| SEC-OPEN-004 | Cross-region WORM replication for regulator-visible DR | Scheduled post-pilot             |
| SEC-OPEN-005 | JetStream cluster HA                                   | Scheduled post-pilot             |

Tracked in [`../gtm/01-security-posture.md`](../gtm/01-security-posture.md).

## Audit trail of trust changes

This document and the rest of the substrate documentation is itself version-controlled. Every change is tracked in git, every claim links to evidence, every evidence artifact lives at a stable repo path. To audit any claim, follow the link.

## Related documents

- [`../gtm/00-executive-brief.md`](../gtm/00-executive-brief.md) — what the substrate is
- [`../gtm/01-security-posture.md`](../gtm/01-security-posture.md) — detailed security architecture
- [`../gtm/02-compliance-matrix.md`](../gtm/02-compliance-matrix.md) — framework-by-framework mapping
- [`../gtm/03-fips-readiness.md`](../gtm/03-fips-readiness.md) — FIPS posture
- [`../gtm/04-evidence-inventory.md`](../gtm/04-evidence-inventory.md) — full evidence catalog
- [`./vulnerability-disclosure.md`](./vulnerability-disclosure.md) — coordinated disclosure policy
- [`./bug-bounty-policy.md`](./bug-bounty-policy.md) — bug bounty terms
