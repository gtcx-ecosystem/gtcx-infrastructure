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
| HEAD                | `56553098e63afef8dad2baf069e5ae3689b0b88a` |
| Branch              | `docs/roadmap-update-2026-05-30`           |
| Internal readiness  | 7.1/10                                     |
| Certified composite | undefined/10                               |
| validate-all        | 36/36 gates (agent closure session)        |

## Post-remediation scope anchors (attach to SOW)

1. **Public API:** `api.gtcx.trade` routes via Cloudflare Tunnel to `compliance-gateway:8500` (not raw protocols).
2. **Replay guard:** `/v1/replay/verify` — contract tests in `tools/contract-tests/`.
3. **Audit chain:** `@gtcx/audit-signer` canonical signing; catalog pinned in `tools/compliance-data/`.
4. **Tenant isolation:** gateway tenancy contract tests; auth failures tagged `platform`.
5. **Closed P0s (2026-05-30 audit):** F1–F4, F7, F10–F14; S2-01–S2-10, S2-14; S3 structural gates.

## Vendor documents (existing)

| Document       | Path                                             |
| -------------- | ------------------------------------------------ |
| Scope          | `docs/audit/pen-test-scope-2026.md`              |
| RFP            | `docs/audit/pen-test-rfp-2026.md`                |
| Shortlist      | `docs/audit/pen-test-vendor-shortlist.md`        |
| Readiness pack | `docs/audit/vendor-engagement-readiness-pack.md` |

## Human escalation (EXT-INF)

- [ ] Leadership selects vendor from shortlist
- [ ] SOW signed (S2-13)
- [ ] Kickoff scheduled against **post-Sprint-1** codebase (Q5 AFTER)

## Agent attestation

- [x] Scope documents present and reference compliance-gateway boundary
- [x] Machine-readable scores in `docs/audit/latest.json`
- [ ] SOW signature and vendor engagement (human)
