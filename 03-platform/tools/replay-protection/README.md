# @gtcx/replay-protection

Backend replay-protection verifier for gtcx-mobile offline queue integrity.

## Principles

- **SECURE (P11)** — nonce uniqueness prevents replay attacks; fail-safe semantics ensure consumed nonces stay consumed
- **RESILIENT (P12)** — clock-skew tolerance for low-connectivity regions; Redis-backed storage for horizontal scaling
- **OBSERVABLE (P15)** — all rejections are counted and exportable as Prometheus metrics; alert rules included
- **AUDITABLE (P3)** — every decision emits a structured audit event with delayed-offline-replay detection

## Quick Start

```js
import { ReplayVerifier } from '@gtcx/replay-protection';
import { MemoryNonceStore } from '@gtcx/replay-protection/store/memory';

const verifier = new ReplayVerifier({
  nonceStore: new MemoryNonceStore(),
  verifySignature: async (integrity) => {
    // Your DID/signature verification logic
    return true;
  },
});

const result = await verifier.verify(integrity, requestData, {
  region: 'global-south',
  requestId: 'trace-123',
  deviceId: 'device-abc',
});

if (!result.allowed) {
  console.error('Rejected:', result.code, result.reason);
}

// Runtime metrics (Prometheus exposition format)
console.log(verifier.metricsPrometheus());
```

## Architecture

```
┌─────────────────┐
│  Mobile Queue   │──► QueueIntegrity payload
└─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│ ReplayVerifier  │────►│  NonceStore  │  (Memory | Redis)
└─────────────────┘     └──────────────┘
         │
    ┌────┴────┬────────────┬─────────────┐
    ▼         ▼            ▼             ▼
Timestamp  Signature    Metrics      AuditSink
 Window    verify()    (Prometheus)  (console|webhook)
```

## Fail-Safe Nonce Semantics

Once a nonce is consumed via atomic `checkAndSet`, it **stays consumed** regardless of whether downstream verification (hash, signature) passes or fails. This prevents attackers from replaying rejected requests.

- Timestamp check happens **before** nonce consumption — bad timestamps don't waste nonces
- Envelope/hash failures **do not** delete the nonce
- Signature failures **do not** delete the nonce
- Legitimate clients must generate a **fresh nonce** for each request

## Clock-Skew Policy

| Region Type                                                     | Base Window | Extra Buffer | Total  |
| --------------------------------------------------------------- | ----------- | ------------ | ------ |
| Standard                                                        | 5 min       | —            | 5 min  |
| Low-connectivity (`global-south`, `rural`, `mesh`, `satellite`) | 5 min       | +10 min      | 15 min |

Future-dated timestamps >2 min ahead are always rejected.

## Rejection Codes

| Code               | Meaning                                |
| ------------------ | -------------------------------------- |
| `REPLAY_OK`        | Accepted                               |
| `REPLAY_NONCE`     | Nonce already consumed                 |
| `REPLAY_STALE`     | Timestamp outside acceptance window    |
| `REPLAY_FUTURE`    | Timestamp is too far in the future     |
| `REPLAY_SIGNATURE` | Signature verification failed          |
| `REPLAY_ENVELOPE`  | Envelope / body / header hash mismatch |

## Integration into Deployed Protocol Path

### Option 1: Sidecar (Recommended for gtcx-agx)

Add the replay-guard container to the `gtcx-agx` pod. The agx container calls `localhost:8400/v1/replay/verify` for every authenticated request carrying `X-GTCX-*` headers.

See: `04-ship/kubernetes/base/services/replay-guard-sidecar-integration.yaml`

### Option 2: Standalone Service

Deploy `gtcx-replay-guard` as a standalone ClusterIP service. Any backend can call it over the network.

See: `04-ship/kubernetes/base/services/replay-guard.yaml`

### Option 3: NGINX auth_request

Add these annotations to the ingress to enforce replay protection at the edge:

```yaml
nginx.ingress.kubernetes.io/auth-url: http://gtcx-replay-guard.gtcx:8400/v1/replay/verify
nginx.ingress.kubernetes.io/auth-response-headers: X-GTCX-Replay-Allowed
```

### Option 4: Express/Fastify Middleware

```js
import { replayGuardMiddleware } from '@gtcx/replay-protection/middleware';
app.use(replayGuardMiddleware({ nonceStore, verifySignature: myDidVerify }));
```

## Hash Algorithm (Mobile Contract)

The server-side hash computation exactly mirrors `gtcx-mobile`'s offline queue:

- **Body hash**: `SHA-256(JSON.stringify(body ?? null))`
- **Headers hash**: `SHA-256(JSON.stringify(sorted(lower-case(entries))))`
- **Envelope hash**: `SHA-256(METHOD + "\n" + pathname + "\n" + sortedQuery + "\n" + bodyHash + "\n" + headersHash + "\n" + timestamp + "\n" + nonce + "\n" + did + "\n" + keyId + "\n" + audience)`

Pathnames are normalized (`//` → `/`). Query parameters are sorted lexicographically.

## Telemetry & Alerts

### Prometheus Metrics

| Metric                            | Type      | Description                           |
| --------------------------------- | --------- | ------------------------------------- |
| `replay_protection_total{code}`   | counter   | Decisions by outcome code             |
| `replay_guard_redis_connected`    | gauge     | 1 = Redis, 0 = unavailable / fallback |
| `replay_protection_clock_skew_ms` | histogram | Absolute clock skew distribution      |

### Alert Rules

See: `04-ship/monitoring/alerts/replay-protection-alerts.yml`

Key alerts:

- `ReplayProtectionSpike` — nonce rejections > 30/sec (possible replay attack)
- `ReplayStaleTimestampSpike` — stale rejections > 10/sec (clock drift or offline backlog)
- `ReplaySignatureFailureSpike` — signature failures > 10/sec (possible key compromise)
- `ReplayGuardDown` — service unavailable
- `ReplayGuardRedisUnavailable` — durable nonce storage unavailable; production traffic blocked

### Grafana Dashboard

See: `04-ship/monitoring/dashboards/replay-protection.json`

### Audit Events

Every decision emits a structured `audit.replay` event:

```json
{
  "type": "audit.replay",
  "eventId": "uuid",
  "timestampMs": 1234567890,
  "eventType": "replay.accepted",
  "nonce": "...",
  "did": "did:gtcx:device:abc123",
  "code": "REPLAY_OK",
  "region": "global-south",
  "clockSkewMs": 480000,
  "acceptanceWindowMs": 900000,
  "isDelayedOfflineReplay": true
}
```

`isDelayedOfflineReplay` is `true` when clock skew exceeds 5 minutes, indicating a queued request from an offline device.

## Exit Gate

> _Replay and stale-request rejection is measurable in runtime, not just code._

```js
// Snapshots
verifier.metricsSnapshot();
// { acceptedTotal: 42, rejectedNonceTotal: 3, rejectedStaleTotal: 1, ... }

// Prometheus exposition
verifier.metricsPrometheus();
// # HELP replay_protection_total Total replay-protection decisions
// replay_protection_total{code="REPLAY_NONCE"} 3
```

## Tests

```bash
pnpm test
```

Runs Node.js built-in test runner across all `.test.mjs` files.
