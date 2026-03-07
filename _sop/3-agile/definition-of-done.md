# Definition of Done

A backlog item is done only when **all** criteria below are met. No exceptions.

---

## Criteria

| Area           | Criteria                                                                    |
| -------------- | --------------------------------------------------------------------------- |
| Spec alignment | Mapped to the relevant spec section in `_sop/2-docs/2-specs/`               |
| Tests          | Unit and integration tests added or updated; coverage thresholds maintained |
| Security       | Threat model considered; key handling validated; no new open HIGH gaps      |
| Performance    | Target metrics met or deviation justified in writing                        |
| Docs           | Updated README or protocol docs as needed                                   |
| Offline        | Offline behavior verified where applicable (queue limits, sync flows)       |
| Review         | Code review completed; no unresolved comments                               |
| CI             | All CI gates green: lint, typecheck, test, build                            |

---

## Coverage Thresholds

Required for any package modified by the work item:

| Metric     | Threshold |
| ---------- | --------- |
| Statements | ≥ 80%     |
| Branches   | ≥ 75%     |
| Functions  | ≥ 80%     |
| Lines      | ≥ 80%     |

---

## Security Criteria Detail

For items touching `packages/crypto/`, signature verification, replay protection, or the audit chain:

- Changes must be reviewed against the threat model in `_sop/2-docs/3-engineering/security/threat-models.md`
- No weakening of signature verification is permitted under any circumstances
- Stub guard (`enforceStubGuard`) must remain intact in all production paths
- See `_sop/1-agents/roles/protocol-security-engineer.md` for full constraints

---

## Offline Criteria Detail

Offline limits that must hold across any change affecting queues:

| Protocol  | Queue Limit                                |
| --------- | ------------------------------------------ |
| TradePass | 45 days                                    |
| GeoTag    | 30 days / 1,000 items                      |
| VaultMark | 30 days / 500 items                        |
| GCI       | Online only (updates require connectivity) |
| PvP       | Network required (no offline queue)        |
| PANX      | Network required                           |

---

## Changing the DoD

The definition of done is a contract between the team and the codebase. Changes require:

1. Proposed change written as an ADR in `_sop/2-docs/1-architecture/decisions/`
2. Human review and approval
3. This file updated to reflect the new criteria

---

_Source: `_archive/legacy/2-specs/_project/planning/definition-of-done.md`_
