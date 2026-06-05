---
title: 'Pen-Test SOW Intake Evidence — Post Sprint 1-3'
status: current
date: '2026-05-31'
owner: agent:security-engineer
tier: critical
tags: ['audit', 'pen-test', 'evidence', 'sow']
review_cycle: on-change
agent_generated: true
human_signature: pending
---

# Pen-Test SOW Intake Evidence — 2026-05-31

> Agent-generated intake pack for EXT-INF-002 / S2-13. Human SOW signature remains
> required before vendor kickoff.

## Repository state

| Field               | Value                                      |
| ------------------- | ------------------------------------------ |
| HEAD                | `994afab784d73df2f561b0fe1f5e2c9897cf6e90` |
| Branch              | `01-docs/roadmap-update-2026-05-30`        |
| Internal readiness  | 7.9/10                                     |
| Certified composite | undefined/10                               |
| validate-all        | 36/36 gates (agent closure session)        |

## Post-remediation scope anchors (attach to SOW)

1. **Public API:** `api.gtcx.trade` routes via Cloudflare Tunnel to `compliance-gateway:8500` (not raw protocols).
2. **Replay guard:** `/v1/replay/verify` — contract tests in `03-platform/tools/contract-tests/`.
3. **Audit chain:** `@gtcx/audit-signer` canonical signing; catalog pinned in `03-platform/tools/compliance-data/`.
4. **Tenant isolation:** gateway tenancy contract tests; auth failures tagged `platform`.
5. **Closed P0s (2026-05-30 audit):** F1–F4, F7, F10–F14; S2-01–S2-10, S2-14; S3 structural gates.

## Vendor documents (existing)

| Document       | Path                                                   |
| -------------- | ------------------------------------------------------ |
| Scope          | `01-docs/05-audit/pen-test-scope-2026.md`              |
| RFP            | `01-docs/05-audit/pen-test-rfp-2026.md`                |
| Shortlist      | `01-docs/05-audit/pen-test-vendor-shortlist.md`        |
| Readiness pack | `01-docs/05-audit/vendor-engagement-readiness-pack.md` |

## Human escalation (EXT-INF)

- [ ] Leadership selects vendor from shortlist
- [ ] SOW signed (S2-13)
- [ ] Kickoff scheduled against **post-Sprint-1** codebase (Q5 AFTER)

## Agent attestation

- [x] Scope documents present and reference compliance-gateway boundary
- [x] Machine-readable scores in `01-docs/05-audit/latest.json`
- [ ] SOW signature and vendor engagement (human)
