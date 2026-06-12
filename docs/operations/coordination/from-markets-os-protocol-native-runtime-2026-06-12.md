---
title: 'Inbound — Markets Protocol-Native Listing Runtime'
status: delivered
date: 2026-06-12
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

Markets commit `3493044` delivers the first enforceable protocol-native listing
slice:

- typed Protocol Applicability Manifest compiler;
- all-six-protocol declaration;
- universal and triggered protocol rules;
- lifecycle-aware pre-market, admission, close, and post-close evaluation;
- signed-manifest and expiry enforcement;
- fail-closed brokerage listing guard;
- reasoned authority exceptions;
- machine-readable contract and drift gates; and
- focused positive and negative tests.

Verification:

- `pnpm --filter @gtx-markets/types test` — 30/30 pass.
- brokerage protocol-listing-admission tests — 3/3 pass.
- brokerage typecheck — pass.
- `pnpm eix:types:check` — pass.
- `pnpm ecosystem:contracts:check` — pass.

Direct `gtcx-os/protocols` handoff:
`XR-MKT-PROTOCOL-NATIVE-001`, accepted in commit `ed7f8c6e`.

## Fabric Next Action

Add the manifest gates to the Golden Transaction and track live evidence
envelope delivery for TradePass, GeoTag, GCI, VaultMark, PvP, and PANX.

## Residual Gap

The manifest and fail-closed guard are live in Markets code. Live protocol
evidence envelopes, authority traces, and end-to-end listing lifecycle wiring
remain required before claiming complete protocol-native execution.

## What This Document Does NOT Cover

- A claim that all protocol services are live.
- Authorization to bypass adopted authorities.
