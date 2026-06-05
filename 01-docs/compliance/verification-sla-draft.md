---
title: 'Indemnified Verification SLA — Draft'
status: 'draft'
date: '2026-05-30'
owner: 'gtcx-legal'
tier: 'critical'
tags: ['sla', 'liability', 'indemnity', 'compliance', 'moat']
review_cycle: 'on-change'
legal_status: 'DRAFT — UNSIGNED — DOES NOT BIND GTCX'
---

# Indemnified Verification SLA — Draft

> **Legal status: DRAFT.** This document is the engineering proposal
> for an indemnified verification SLA. It is **not** a binding GTCX
> commitment. Publication requires legal review, insurance procurement,
> and a signed corporate resolution. The draft is committed to the
> repository so legal review can happen against a concrete artifact
> rather than a verbal description.

## Why an SLA matters more than the code

Per `~/.claude/DEFENSIBLE_SOFTWARE.md`, the five verticals of durable
value are **Trust, Context, Distribution, Taste, Liability**. Code is
copyable; data is copyable with effort; integrations are copyable.
The thing competitors cannot replicate by writing more code is a
_balance sheet_ indemnifying their claims.

A funded competitor can ship a tamper-evident audit chain in 90 days.
They cannot, in 90 days, also:

1. Acquire E&O / cyber-liability insurance covering specific
   verification claims.
2. Get a corporate board to authorize an indemnity covering those
   claims.
3. Hold the indemnity for long enough that a regulator's reference
   architecture treats it as the load-bearing trust layer.

This SLA is the seed of that moat. The earlier we publish a credible,
specific, indemnified commitment, the longer the lead time competitors
must close before they can match us.

## What this SLA covers

This SLA applies to the **Verifiable Audit Chain** produced by:

- `@gtcx/audit-signer@>=0.1.0` (npm)
- `@gtcx/compliance-gateway@>=0.1.0` (deployed instance)
- `@gtcx/audit-flush@>=0.1.0` (deployed instance writing to a WORM bucket
  with Object Lock COMPLIANCE retention)
- `@gtcx/compliance-data@>=1.1.0` (signed regulatory catalog)

Specifically, **GTCX represents and warrants** to a Customer that
operates an instance under the GTCX-published Operational Guidelines
that:

1. **Cryptographic integrity.** Every audit record produced by an
   instance carries an Ed25519 signature over its canonicalized
   contents. Tampering with any signed record breaks `verifyChain`
   on that section.

2. **Chain continuity.** Records produced by the same signing key,
   appended through the gateway's `signAuditEvent`, form a hash-linked
   chain where each record's `prevHash` equals the SHA-256 of the
   canonicalized prior record. Re-ordering or omitting a record
   breaks linkage.

3. **WORM retention.** When `@gtcx/audit-flush` is deployed alongside
   the gateway with a properly configured `terraform-aws-compliance-db`
   WORM bucket, batches written to S3 are subject to Object Lock
   COMPLIANCE retention for a minimum of the duration specified in
   `AUDIT_S3_RETENTION_DAYS` (default 2557 days = 7 years, the FATF
   audit-record floor).

4. **Catalog correctness.** The `@gtcx/compliance-data` jurisdiction
   record for a given country, as of the catalog version cited in the
   audit envelope, accurately reflects the regulator, retention
   floors, and cross-border conditions documented by that country's
   primary regulatory authority as of the catalog publication date.

## What this SLA does NOT cover

To be credible, the SLA must be honest about its scope:

- **External verification failures.** If an auditor verifies a
  bundle using a non-canonical implementation of `verifyChain` and
  it accepts a tampered record, that's a verifier defect, not a
  GTCX defect. The reference implementation in `@gtcx/audit-signer`
  is the canonical verifier.
- **Operator misconfiguration.** If the Customer deploys the gateway
  without a signing key (`AUDIT_SIGNING_KEY_B64`), or without
  audit-flush, or with the WORM bucket misconfigured, GTCX has no
  liability. The Operational Guidelines specify the required
  configuration; deviation voids the SLA.
- **Lawful disclosure.** Records are tamper-evident, not secret. A
  subpoena, search warrant, or regulator order requiring production
  of records is honored; GTCX is not liable for downstream use of
  produced records.
- **Acts of God / cryptographic breakage.** A future break of
  Ed25519 or SHA-256 voids the cryptographic guarantees of all
  records signed before the break date. Standard cryptographic-
  failure exclusion.
- **Catalog updates.** When a regulator changes its retention floor
  after a catalog publication, the published version's record for
  that country is correct as of the publication date but stale
  thereafter. Customers must consume the latest signed catalog
  version. SLA covers catalog version accuracy at publication time.

## Service Levels (proposed values — pending insurance quote)

| Service Level                           | Commitment                                            | Remedy on breach                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Audit-chain integrity (per record)      | 100% — if verifyChain accepts the chain, no tampering | If `verifyChain` accepts a record that GTCX produced and the record was tampered: TBD indemnity per affected audit cycle, capped at TBD per year.                        |
| WORM retention duration                 | ≥ AUDIT_S3_RETENTION_DAYS (default 7 years)           | If a record is found missing from the WORM bucket prior to the retention floor due to GTCX-produced gateway/flush defect: TBD remediation cost + TBD per-record penalty. |
| Catalog correctness at publication date | Per published `CITATION.cff` `date-released` field    | If a published catalog version misrepresents a regulator/retention/cross-border for a covered jurisdiction: TBD per-customer remediation cost.                           |
| Signing-key compromise notification     | ≤ 24 hours from GTCX detection                        | Customer rotates trust assumptions; no monetary remedy (notification commitment only).                                                                                   |

**TBD values are deliberately blank.** They depend on the insurance
quote and the corporate-resolution scope. Engineering's draft is the
_structure_; legal + finance set the _numbers_.

## Eligibility

This SLA is offered to:

- Customers on a signed master services agreement that references
  this SLA by version.
- Pilots whose pilot agreement (e.g. `pilot-success-criteria.md`)
  references this SLA — initially at a _reduced_ monetary cap until
  the pilot graduates to production.

Open-source users of `@gtcx/audit-signer` and `@gtcx/compliance-data`
receive the technical guarantees (the verifier is the verifier) but
no monetary indemnity. The MIT license disclaims warranty by default.

## Verification + dispute process

1. **Customer raises an SLA event** via the formal contact in the
   MSA. Email + PagerDuty + signed letter required for SLA-monetary-
   remedy claims.
2. **GTCX provides the in-question records** + signed evidence bundle
   showing the chain head + verification result at the time GTCX
   produced them.
3. **Independent third-party verification.** Both parties run
   `verifyChain` on the bundle. Customer may use any implementation
   matching the canonical specification in `@gtcx/audit-signer`'s
   `signer.mjs` and `chain.mjs`.
4. **If verification disagrees:** the canonical reference
   implementation is binding. Discrepancies in third-party
   verifiers are reported to the verifier's maintainer; GTCX is
   not liable for verifier defects.
5. **If GTCX-produced records demonstrably tampered:** SLA monetary
   remedy applies per the schedule above; customer is also entitled
   to a full audit-cycle re-run at GTCX expense.

## Publication checklist (before this draft becomes a binding SLA)

- [ ] Legal review (corporate counsel) — at minimum a 2-week window.
- [ ] E&O / cyber-liability insurance quote covering the proposed
      monetary remedies. The TBD values are filled from this quote.
- [ ] Board resolution authorizing the SLA.
- [ ] Operational Guidelines doc published (mandatory deployment
      configuration that voids the SLA when deviated from).
- [ ] Signed CITATION.cff field added to the SLA pointing at the
      published @gtcx/compliance-data version.
- [ ] Public RFC period — 60 days minimum — soliciting customer
      feedback on the remedy structure.
- [ ] First customer signature (likely a pilot graduation) referencing
      this SLA by version.

## Status

- **2026-05-30** — Draft committed by engineering. Awaiting legal review.
- **NEXT** — Engineering hands off to legal for the publication
  checklist. The repository version remains `status: draft` until
  every checklist item is signed off.

---

> **Final note for legal review.** The structure here is deliberately
> conservative — the SLA covers _cryptographic and retention claims
> GTCX can verifiably honor_, not soft promises about uptime or
> support response. The moat play is **specificity**: a customer's
> regulator can cite "GTCX's published Verification SLA v1.0" by
> version + hash and trust that the commitment is technically and
> contractually binding. Reducing scope to expand reliability is the
> right trade.
