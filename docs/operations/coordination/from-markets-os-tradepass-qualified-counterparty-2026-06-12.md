---
title: 'Handoff — TradePass and Markets Qualified Counterparty Programme'
status: open
date: 2026-06-12
owner: fabric-os
from: markets-os
to: fabric-os
ticket: XR-MKT-TRADEPASS-001
program: PROG-CAPITAL-FORMATION-001
protocol: P24
priority: P0
blocksIR: false
---

# Handoff: TradePass and Markets Qualified Counterparty Programme

## Required Decision

Coordinate the `gtcx-os/protocols` TradePass owner and Markets OS as a joint
workstream for the Participant Capability and Reliability Passport.

Canonical product specification:
`docs/specs/participant-capability-and-reliability-passport-product-spec.md`.

Direct protocol-owner handoff:
`docs/operations/coordination/to-gtcx-os-protocols-tradepass-qualified-counterparty-2026-06-12.md`.

## Ownership Boundary

| Domain                                                                                                                                                                              | Authority           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Stable participant identity, legal entity, beneficial ownership, representatives, signatories, credentials, roles, consent, privacy, revocation, and portable reputation assertions | TradePass           |
| Transaction capability policy, dimensional assessment, transaction qualification, conditions, exposure, market access, and realized market outcomes                                 | Markets OS / EIX    |
| Screening, adverse events, fraud, references, and surveillance                                                                                                                      | Veritas             |
| Compliance, eligibility, licensing, jurisdiction, and regulatory evidence                                                                                                           | Compliance OS + GCI |
| Signed evidence, qualification, outcome, correction, and revocation envelopes                                                                                                       | `gtcx-os/protocols` |
| Runtime, connectors, live traces, conformance, and programme coordination                                                                                                           | Fabric OS           |

TradePass credentials must not independently qualify a participant for a
specific transaction. Markets must not duplicate or become authoritative for
the reusable participant identity record.

## Required Contracts

1. `ParticipantTrustPassport`
2. `ParticipantCredentialAssertion`
3. `CapabilityEvidenceAssertion`
4. `TransactionQualificationRequest`
5. `TransactionQualificationDecision`
6. `ParticipantOutcomeEvidence`
7. `CredentialCorrectionOrRevocation`
8. `QualificationAppealOrRemediation`

Every contract must preserve issuer, authority, scope, consent, visibility,
freshness, expiry, confidence, evidence references, version, and signature.

## First Proof

Run one offtake buyer qualification and one capital-provider qualification:

1. TradePass establishes identity, ownership, signatory, mandate, credentials,
   and permitted disclosure.
2. Veritas and adopted providers verify references, adverse events, capacity,
   and proof-of-funds evidence.
3. Markets evaluates transaction-specific capability, authority, limits,
   conditions, and market access.
4. The participant receives a reasoned, expiring qualification decision.
5. Markets records actual bid, funding, settlement, delivery, and close
   outcomes.
6. Scoped verified outcomes return to TradePass as reusable reputation
   evidence.

## Fabric Actions

1. Coordinate the TradePass owner in `gtcx-os/platform/protocols` and Markets
   OS owner.
2. Publish the cross-repo contract and authority matrix.
3. Add the workstream to the Golden Transaction and Capital Formation
   programme.
4. Define privacy, selective-disclosure, correction, appeal, and fairness
   gates.
5. Establish live authority traces and conformance fixtures.

## Acceptance Criteria

- TradePass and Markets ownership boundaries are adopted.
- Required contracts have owners, schemas, fixtures, and version policy.
- One buyer and one investor complete live co-owned qualification.
- Qualification controls data-room, demand-book, bid, or allocation access.
- Scoped realized outcomes return to TradePass without leaking confidential
  transaction information.
- No tier is represented as a credit rating, guarantee, or purchasable status.

## What This Document Does NOT Cover

- Authorization for regulated identity, credit-rating, investment, compliance,
  or transaction activity.
- Public disclosure of confidential participant or transaction evidence.
- A guarantee that a qualified participant will perform.
