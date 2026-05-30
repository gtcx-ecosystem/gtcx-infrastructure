---
title: 'Adaptive Low-Bandwidth Mode'
status: 'implemented'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['resilience', 'low-bandwidth', 'offline', 'global-south', 'architecture']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Adaptive Low-Bandwidth Mode

**Scope:** All GTCX production services deployed to frontier regions  
**Status:** v0.1.0 implemented and integrated into compliance-gateway  
**Related:** [Resilience Framework](../specs/resilience-framework.md), [Replay Guard](../operations/runbooks/replay-guard-failure.md), [`tools/low-bandwidth`](../../tools/low-bandwidth/)

---

## 1. Problem Statement

GTCX targets African markets where:

- Median mobile data speed: 2–8 Mbps (urban), < 1 Mbps (rural)
- Intermittent connectivity: 4–12 hours of downtime per day in some regions
- Expensive data: $2–5 per GB, making large payloads prohibitive

Current services assume always-on, low-latency connectivity. This document specifies an adaptive low-bandwidth mode that degrades gracefully without breaking core functionality.

---

## 2. Design Principles

1. **Offline-first data structures** — All user actions must be queueable locally and replayable when connectivity returns.
2. **Progressive payload reduction** — Automatically reduce response size as bandwidth drops (JSON → compact JSON → minimal binary).
3. **Time-shifted tolerance** — Extend replay windows for low-connectivity regions without compromising security.
4. **Never fail silently** — Every degradation emits a structured telemetry event.

---

## 3. Degradation Levels

| Level       | Trigger (est. bandwidth) | Behavior                                                         |
| ----------- | ------------------------ | ---------------------------------------------------------------- |
| **Normal**  | > 2 Mbps                 | Full JSON API, real-time sync, 5-min replay window               |
| **Reduced** | 0.5–2 Mbps               | Compact JSON encoding, batched sync, 15-min replay window        |
| **Minimal** | < 0.5 Mbps               | Minimal binary sync, USSD fallback channel, 15-min replay window |
| **Offline** | 0 Mbps                   | Local queue only, full autonomy for 72 hours                     |

---

## 4. Implementation

### 4.1 Shipped v0.1.0 (`tools/low-bandwidth`)

The server-side low-bandwidth toolkit is implemented as `@gtcx/low-bandwidth` with the following modules:

**Encoder (`src/encoder.mjs`)**

- `encode(value, encoding)` — serializes to `json`, `compact-json`, or `minimal-binary`
- `decode(data, encoding)` — deserializes from any supported format
- `encodeMinimalBinary(value)` / `decodeMinimalBinary(buf)` — custom v1 binary protocol with type-tagged primitive fields (uint8/16/32, int32, float64, string, bool, null)

**Negotiator (`src/negotiator.mjs`)**

- `resolveLevel(req)` — determines degradation level from `Save-Data`, `?lowBandwidth`, and `Downlink` headers
- `acceptsLowBandwidth(req)` — boolean check for client intent
- `mostRestrictive(levels)` — computes the most restrictive level from a list
- `encodingForLevel(level)` — maps `normal→json`, `reduced→compact-json`, `minimal/offline→minimal-binary`
- `replayWindowForLevel(level)` — returns 5 min (normal) or 15 min (reduced/minimal/offline)

**Trimmer (`src/trimmer.mjs`)**

- `trimObject(obj, schema)` — schema-based field omission for response payloads
- `buildMinimalResponse(fullResponse, endpoint)` — endpoint-aware stripping (e.g., `/v1/query` keeps `answer` + `routing.provider`, strips `authz` + `usage`)
- `estimateReduction(before, after)` — telemetry helper for payload savings

**Telemetry (`src/telemetry.mjs`)**

- `createDegradationEvent(req, level)` — structured event with region, bandwidth, latency, queue depth
- `shouldAlert(events)` — triggers PagerDuty if > 5% of devices in a region are offline > 30 min
- `toPrometheusMetrics(events)` — converts events to Prometheus exposition format

**Middleware (`src/middleware.mjs`)**

- `createTransform(options)` — returns `{ transform(req, data) }` that detects level, trims, and encodes
- `createEventFromRequest(req, level)` — builds degradation events from HTTP requests

### 4.2 Compliance-Gateway Integration

The compliance-gateway (`tools/compliance-gateway`) integrates low-bandwidth directly in `src/server.mjs`:

- `detectLowBandwidth(req)` — checks `Save-Data: on`, `?lowBandwidth=true/1`, and `Downlink < 0.5`
- `stripForLowBandwidth(body, endpoint)` — endpoint-specific trimming for `/v1/query`, `/v1/tools`, `/v1/providers`
- `sendJson(res, status, body, req)` — applies low-bandwidth stripping + `gzip`/`brotli` compression
- Responses include `X-Low-Bandwidth: true/false` and `Cache-Control: max-age=300, public` when in low-bandwidth mode

### 4.3 Replay Guard

The replay guard already supports region-specific clock-skew windows (see `docs/ml/model-cards/replay-guard-model-card.md`):

- `global-south` region: 15-minute window (vs. 5-minute default)
- `satellite` / `rural` sub-regions: 15-minute window

This aligns with low-bandwidth mode without additional changes.

### 4.4 Client Queue (Future)

- **Mobile SDK:** SQLite-backed queue with automatic compression (zstd)
- **Max queue depth:** 10,000 transactions (~2 MB compressed)
- **Sync strategy:** Exponential backoff with jitter; batch up to 50 transactions per sync

### 4.5 Server-Side Adaptation (Future)

- **CDN edge caching:** Static assets cached at Cloudflare POPs in Johannesburg, Lagos, Nairobi
- **Connection keep-alive:** Extended to 300s to reduce TLS handshake overhead

---

## 5. Telemetry & Observability

Every degradation event emits:

```json
{
  "type": "resilience.degradation",
  "level": "reduced|minimal|offline",
  "region": "zimbabwe-masvingo",
  "bandwidth_bps": 384000,
  "latency_ms": 2800,
  "queue_depth": 47,
  "timestamp": "2026-05-17T12:00:00Z"
}
```

Alerting: PagerDuty alert if > 5% of active devices in a region are in `offline` mode for > 30 minutes.

---

## 6. Security Considerations

- **Replay window extension:** Already covered by replay-guard regional policy. The 15-minute window is still cryptographically bounded by nonce uniqueness.
- **Queue encryption:** Local SQLite queue must be encrypted at rest using device-bound keys.
- **Tamper detection:** Each queued transaction includes an Ed25519 signature; replay verifies integrity.

---

## 7. Acceptance Criteria

- [x] Server-side encoder supports `json`, `compact-json`, and `minimal-binary` formats
- [x] `stripForLowBandwidth` reduces average response size by ≥ 70% for `/v1/query` and `/v1/providers`
- [x] Compliance-gateway detects low-bandwidth via `Save-Data`, query params, and `Downlink` headers
- [x] Telemetry emits structured degradation events with region, bandwidth, and latency
- [ ] Mobile SDK implements negotiation and local queueing
- [ ] 72-hour offline autonomy demonstrated in chaos test
- [ ] Telemetry dashboard shows degradation events by region

---

## 8. References

- [`tools/low-bandwidth`](../../tools/low-bandwidth/) — v0.1.0 implementation
- [`tools/compliance-gateway/src/server.mjs`](../../tools/compliance-gateway/src/server.mjs) — gateway integration
- [Resilience Framework](../specs/resilience-framework.md)
- [Replay Guard Model Card](../governance/model-cards/replay-guard-model-card.md)
