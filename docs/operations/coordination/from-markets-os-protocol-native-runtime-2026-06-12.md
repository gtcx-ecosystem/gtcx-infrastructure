---
title: 'Inbound — Markets Protocol-Native Listing Runtime'
status: accepted
date: 2026-06-12
owner: fabric-os
from: markets-os
to: fabric-os
ticket: XR-MKT-PROTOCOL-NATIVE-001
program: PROG-CAPITAL-FORMATION-001
protocol: P24
laneId: L4b
priority: P0
blocksIR: false
---

# Inbound: Markets Protocol-Native Listing Runtime

Markets commits `3493044`, `178ed93`, `37a5f11`, `18a1299`, `b199773`, and
`86c6dd1` deliver the enforceable Markets-side protocol-native listing runtime:

- typed Protocol Applicability Manifest compiler;
- all-six-protocol declaration;
- universal and triggered protocol rules;
- lifecycle-aware pre-market, admission, close, and post-close evaluation;
- signed-manifest and expiry enforcement;
- fail-closed brokerage admission and settlement-confirmation guards;
- reasoned authority exceptions;
- tenant-scoped durable manifest persistence;
- purpose-bound remote verification at registration, admission, and close;
- execution-time re-verification so later revocation blocks mutation;
- append-only verification traces for allowed, rejected, and unavailable
  decisions;
- machine-readable contracts and drift gates; and
- focused positive and negative tests.

Verification:

- brokerage tests — 112 passed, 1 skipped.
- database tests — 109 passed, 5 skipped.
- brokerage typecheck — pass.
- Prisma schema validation — pass.
- `pnpm eix:types:check` — pass.
- `pnpm ecosystem:contracts:check` — pass.

Direct `gtcx-os/protocols` handoff:
`XR-MKT-PROTOCOL-NATIVE-001`, accepted in commit `ed7f8c6e`.

`gtcx-os/protocols` PNV-1 is implemented in commit `aeefd48e`:

- canonical manifest signing preimage with the signature field excluded;
- adopted GTCX Ed25519 wire envelope;
- exact-manifest SHA-256 receipt binding;
- authorized-signer registry contract; and
- purpose-bound verification request, receipt, and rejection contracts.

## Runtime Contract

Markets calls:

```text
POST /v1/protocol-manifests/verify
```

using:

- `GTCX_OS_PROTOCOLS_VERIFIER_URL`;
- `GTCX_OS_PROTOCOLS_VERIFIER_TOKEN`; and
- the machine-readable contract at
  `platform/contracts/ecosystem/protocol-manifest-verification.json`.

The verifier response must be purpose-bound to `registration`, `admission`, or
`close` and digest-bound to the exact submitted manifest. Markets fails closed
for invalid signatures, unauthorized signers, replay, revocation, binding
mismatch, invalid responses, and verifier unavailability.

Markets exposes authenticated append-only traces at:

```text
/internal/protocol-manifests/{listingId}/verification-traces
```

## Fabric Execution Plan

1. Deploy the `gtcx-os/protocols` verifier route after its owner publishes the
   signing preimage, signer registry, authority adapters, and signed receipt
   implementation.
2. Inject verifier URL and token into Markets through the adopted secret and
   deployment controls; do not commit either value.
3. Provision required distributed replay and revocation dependencies and make
   their unavailability fail readiness.
4. Deploy the Markets durable manifest and verification-trace migrations.
5. Add authenticated health probes for the verifier and Markets trace route.
6. Exercise and retain one live Golden Transaction trace pack.

## Golden Transaction Evidence Matrix

| Case                       | Required evidence                                        |
| -------------------------- | -------------------------------------------------------- |
| Registration allowed       | Protocol receipt plus Markets allowed trace              |
| Admission allowed          | Fresh admission receipt plus resulting state transition  |
| Close allowed              | Fresh close receipt plus resulting settlement transition |
| Revoked after registration | Admission rejection and unchanged listing state          |
| Revoked after admission    | Close rejection and unchanged settlement state           |
| Invalid signature          | `INVALID_SIGNATURE` rejection trace                      |
| Unauthorized signer        | `UNAUTHORIZED_SIGNER` rejection trace                    |
| Replay                     | `REPLAY_DETECTED` rejection trace                        |
| Binding mismatch           | `VERIFICATION_BINDING_MISMATCH` rejection trace          |
| Verifier outage            | Markets unavailable trace and no state mutation          |
| Trace persistence failure  | Markets fails closed and no state mutation               |

Every trace pack must identify the deployed versions and distinguish live
authority calls from fixtures. Fixture-only evidence cannot close this
handoff.

## Residual Gap

The Markets boundary and the `gtcx-os/protocols` PNV-1 signing and receipt
contract are implemented. The live verifier route, signer-registry runtime,
authority adapters, signed receipt issuer, Fabric deployment configuration,
and live Golden Transaction trace pack remain required before claiming
complete protocol-native execution.

## What This Document Does NOT Cover

- A claim that all protocol services are live.
- Authorization to bypass adopted authorities.
