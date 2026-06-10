---
title: 'EXT-INF-002 — Pen-test SOW sovereign approval'
status: current
date: 2026-06-10
owner: gtcx-infrastructure
from: human:sovereign
to: gtcx-core, gtcx-agentic
authorityClass: S
tags: ['coordination', 'ext-inf-002', 'pen-test', 'assurance']
---

# EXT-INF-002 — Pen-test SOW sovereign approval

**Work ID:** EXT-INF-002 / S2-13  
**Authority:** Class S — sovereign human approval recorded  
**Evidence:** [`audit/evidence/ext-inf-002-sow-approval-2026-06-10.json`](../../../audit/evidence/ext-inf-002-sow-approval-2026-06-10.json)

## Summary

Sovereign operator approved the **live-stack pen-test vendor SOW path** on 2026-06-10. Intake pack (FA-S6-02 vendor artifacts + infra scope anchors) is cleared for procurement countersign and vendor kickoff.

## Preconditions met

| Check                     | Status                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| DAAS-S1 staging substrate | complete — AGX `/api/health` 200, authority trace 7/7                                                                                   |
| validate-all              | 55/55                                                                                                                                   |
| Vendor pack ack           | [`from-gtcx-infrastructure-ext-inf-002-pack-ack-2026-06-07.md`](./outbound/from-gtcx-infrastructure-ext-inf-002-pack-ack-2026-06-07.md) |
| Master audit composite    | 8.4 (A-) — [`audit/master-audit-2026-06-10.md`](../../../audit/master-audit-2026-06-10.md)                                              |

## Remaining (procurement execution — not repo-blocked)

| Step                   | Owner                  | Status                      |
| ---------------------- | ---------------------- | --------------------------- |
| Vendor SOW countersign | Security + procurement | **authorized** — execute    |
| Kickoff scheduling     | gtcx-infrastructure    | **ready** after countersign |
| Findings intake        | gtcx-infrastructure    | after test window           |

## Hub action

Mirror approval in `remaining-cross-repo-work` and decrement assurance external blocker for EXT-INF-002.
