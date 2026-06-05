# @gtcx/low-bandwidth

Server-side adaptive low-bandwidth middleware for GTCX frontier deployments.

## Overview

African markets where GTCX operates face median mobile speeds of 2–8 Mbps (urban) and < 1 Mbps (rural), with intermittent connectivity and expensive data ($2–5/GB). This toolkit provides progressive payload reduction, content negotiation, and telemetry so that GTCX services degrade gracefully instead of failing outright.

## Modules

| Module     | File                             | Purpose                                                           |
| ---------- | -------------------------------- | ----------------------------------------------------------------- |
| Encoder    | `03-platform/src/encoder.mjs`    | `json`, `compact-json`, and `minimal-binary` serialization        |
| Negotiator | `03-platform/src/negotiator.mjs` | Level resolution, encoding selection, replay-window mapping       |
| Trimmer    | `03-platform/src/trimmer.mjs`    | Schema-based field omission and endpoint-aware response stripping |
| Telemetry  | `03-platform/src/telemetry.mjs`  | Structured degradation events, alerting, and Prometheus metrics   |
| Middleware | `03-platform/src/middleware.mjs` | `createTransform` for adaptive HTTP middleware                    |

## Encodings

- **json** — standard indented JSON (normal mode)
- **compact-json** — whitespace-stripped JSON (reduced mode)
- **minimal-binary** — custom tiny binary protocol for essential fields (minimal/offline mode)

The minimal-binary format uses a version byte (`0x01`), field count, and type-tagged values (uint8/16/32, int32, float64, string, bool, null).

## Integration

The compliance-gateway (`03-platform/tools/compliance-gateway`) integrates this toolkit directly via `detectLowBandwidth`, `stripForLowBandwidth`, and `sendJson` in `03-platform/src/server.mjs`.

## Test Coverage

```bash
pnpm test:coverage:gate
```

Gate: 90% branches, statements, functions, and lines. Currently passing.

## Version

v0.1.0 — shipped M3 2026
