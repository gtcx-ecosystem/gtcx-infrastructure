---
title: 'Outbound — EXT-INF-002 vendor pack receipt ack'
status: current
date: 2026-06-07
owner: gtcx-infrastructure
to: gtcx-core
from: gtcx-infrastructure
protocol: gtcx-docs/01-docs/governance/protocols/24-cross-repo-coordination/protocol.md
tags: ['coordination', 'outbound', 'ext-inf-002', 'witness']
---

# Outbound — EXT-INF-002 vendor pack receipt (gtcx-core)

**From:** gtcx-infrastructure  
**To:** gtcx-core  
**Work ID:** EXT-INF-002 (pack intake only)  
**Authority:** Class A witness — SOW signature remains Class S

---

## Summary

gtcx-infrastructure **acknowledges receipt** of gtcx-core FA-S6-02 vendor pen-test pack (22 artifacts). Pack will be attached to live-stack SOW per [`pen-test-intake-evidence-2026-05-31.md`](../../../audit/pen-test-intake-evidence-2026-05-31.md).

## Verification

| Check                   | Result                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Core manifest on `main` | [`vendor-pen-test-pack-manifest-latest.json`](https://github.com/gtcx-ecosystem/gtcx-core/blob/main/01-docs/05-audit/evidence/vendor-pen-test-pack-manifest-latest.json) |
| Infra intake SoR        | [`pen-test-intake-evidence-2026-05-31.md`](../../../audit/pen-test-intake-evidence-2026-05-31.md)                                                                        |
| Human gate register     | [`ext-inf-human-gates-unblock-2026-06-06.md`](./ext-inf-human-gates-unblock-2026-06-06.md)                                                                               |

## Remaining (Class S — not closed by this ack)

| Gate                   | Owner                  | Status                       |
| ---------------------- | ---------------------- | ---------------------------- |
| Pen-test SOW signature | Security + procurement | **open** (target 2026-06-13) |
| Live-stack vendor test | gtcx-infrastructure    | **blocked** until SOW        |

## gtcx-core action

Mirror inbound: `from-gtcx-infrastructure-ext-inf-002-ack-2026-06-07.md` — mark EXT-INF-002 **outbound-acknowledged** in `remaining-cross-repo-work`.
