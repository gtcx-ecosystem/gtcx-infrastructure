---
title: 'Adaptive Low-Bandwidth Mode'
status: 'draft'
date: '2026-05-17'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['resilience', 'low-bandwidth', 'offline', 'global-south', 'architecture']
review_cycle: 'quarterly'
---

# Adaptive Low-Bandwidth Mode

**Scope:** All GTCX production services deployed to frontier regions  
**Status:** Draft specification — implementation pending M3  
**Related:** [Resilience Framework](../specs/resilience-framework.md), [Replay Guard](../operations/runbooks/replay-guard-failure.md)

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
2. **Progressive payload reduction** — Automatically reduce response size as bandwidth drops (JSON → MessagePack → binary delta).
3. **Time-shifted tolerance** — Extend replay windows for low-connectivity regions without compromising security.
4. **Never fail silently** — Every degradation emits a structured telemetry event.

---

## 3. Degradation Levels

| Level       | Trigger (est. bandwidth) | Behavior                                                       |
| ----------- | ------------------------ | -------------------------------------------------------------- |
| **Normal**  | > 2 Mbps                 | Full JSON API, real-time sync, 5-min replay window             |
| **Reduced** | 0.5–2 Mbps               | MessagePack encoding, batched sync, 15-min replay window       |
| **Minimal** | < 0.5 Mbps               | Binary delta sync, USSD fallback channel, 15-min replay window |
| **Offline** | 0 Mbps                   | Local queue only, full autonomy for 72 hours                   |

---

## 4. Implementation Areas

### 4.1 Protocol Layer

- **Negotiation:** Client sends `Accept-Encoding: gtcx-lbw-v1` header; server responds with smallest viable format.
- **Payload sizes:**
  - Normal: ~4 KB per transaction envelope
  - Reduced: ~1.2 KB (MessagePack + field omission)
  - Minimal: ~200 B (binary delta + essential fields only)

### 4.2 Replay Guard

The replay guard already supports region-specific clock-skew windows (see `docs/ml/model-cards/replay-guard-model-card.md`):

- `global-south` region: 15-minute window (vs. 5-minute default)
- `satellite` / `rural` sub-regions: 15-minute window

This aligns with low-bandwidth mode without additional changes.

### 4.3 Client Queue

- **Mobile SDK:** SQLite-backed queue with automatic compression (zstd)
- **Max queue depth:** 10,000 transactions (~2 MB compressed)
- **Sync strategy:** Exponential backoff with jitter; batch up to 50 transactions per sync

### 4.4 Server-Side Adaptation

- **CDN edge caching:** Static assets cached at Cloudflare POPs in Johannesburg, Lagos, Nairobi
- **API response trimming:** `?mode=minimal` query parameter omits non-essential fields
- **Connection keep-alive:** Extended to 300s to reduce TLS handshake overhead

---

## 5. Telemetry & Observability

Every degradation event must emit:

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

- ** replay window extension:** Already covered by replay-guard regional policy. The 15-minute window is still cryptographically bounded by nonce uniqueness.
- **Queue encryption:** Local SQLite queue must be encrypted at rest using device-bound keys.
- **Tamper detection:** Each queued transaction includes an Ed25519 signature; replay verifies integrity.

---

## 7. Acceptance Criteria

- [ ] Mobile SDK implements `gtcx-lbw-v1` negotiation
- [ ] Server responds with MessagePack when requested
- [ ] `?mode=minimal` reduces average response size by ≥ 70%
- [ ] 72-hour offline autonomy demonstrated in chaos test
- [ ] Telemetry dashboard shows degradation events by region

---

## 8. References

- [Resilience Framework](../specs/resilience-framework.md)
- [Replay Guard Model Card](../ml/model-cards/replay-guard-model-card.md)
