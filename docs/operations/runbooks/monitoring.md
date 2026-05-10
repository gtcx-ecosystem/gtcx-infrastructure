# Guide: Monitoring and Observability

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

How to instrument, monitor, and alert on the GTCX Protocol layer in production.

## Observability Stack

The protocols use `@gtcx/observability` — a thin adapter over OpenTelemetry. All metrics and logging flow through injectable interfaces, so any collector can be wired without protocol code changes.

```typescript
import { IMetricsCollector, ILogger } from '@gtcx/observability';
```

## Required Signals

Every production deployment must emit:

- **Metrics** — latency, error rate, throughput, saturation per protocol
- **Logs** — structured JSON, correlated by request, PII-free
- **Health checks** — per-service endpoint verifying store connectivity and crypto provider health

## Key Metrics

### Auth and Security

| Metric                                   | Type    | Signal                                                           |
| ---------------------------------------- | ------- | ---------------------------------------------------------------- |
| `gtcx_auth_failures_total{reason}`       | Counter | Auth failure rate by reason (invalid_token, lockout, rate_limit) |
| `gtcx_lockout_events_total`              | Counter | Spike indicates brute force                                      |
| `gtcx_rate_limit_rejections_total{path}` | Counter | Rate limit exhaustion by endpoint                                |

### Replay Cache

| Metric                                      | Type    | Signal                                        |
| ------------------------------------------- | ------- | --------------------------------------------- |
| `gtcx_pvp_replay_check_total{result}`       | Counter | `result=rejected` spike signals replay attack |
| `gtcx_vaultmark_replay_check_total{result}` | Counter | Custody replay detection                      |

### Audit Log

| Metric                                | Type      | Signal                                        |
| ------------------------------------- | --------- | --------------------------------------------- |
| `gtcx_audit_append_total{outcome}`    | Counter   | `outcome=denied` spike warrants investigation |
| `gtcx_audit_chain_verify_duration_ms` | Histogram | Hash chain verification latency               |

### Protocol Operations

| Metric                                        | Type      | Target  |
| --------------------------------------------- | --------- | ------- |
| `gtcx_tradepass_verification_duration_ms`     | Histogram | < 2s    |
| `gtcx_geotag_capture_duration_ms`             | Histogram | < 200ms |
| `gtcx_gci_calculation_duration_ms`            | Histogram | < 500ms |
| `gtcx_pvp_escrow_creation_duration_ms`        | Histogram | < 2s    |
| `gtcx_vaultmark_custody_transfer_duration_ms` | Histogram | < 2s    |

## Wiring a Metrics Collector

```typescript
import { createPrometheusMetricsCollector } from '@gtcx/observability';

const metrics = createPrometheusMetricsCollector({
  prefix: 'gtcx',
  labels: { env: process.env.NODE_ENV },
});

const authMiddleware = createAuthMiddleware({
  ...config,
  metrics,
});
```

## Logging Standards

All protocol packages accept an `ILogger` interface. Follow these rules:

- Always include `protocol`, `operation`, and `actor` on security-relevant events.
- Never log raw key material, full credential payloads, or PII.
- Auth failures must log `reason` and `actor` — never the supplied credential value.

```typescript
logger.warn('auth.failure', {
  protocol: 'tradepass',
  actor: request.actorId,
  reason: 'signature_invalid',
  // NOT: credential: request.credential
});
```

## Health Checks

Expose a `/health` endpoint that verifies:

| Check           | Healthy When                                        |
| --------------- | --------------------------------------------------- |
| Audit log       | Last append succeeded; chain verification passes    |
| Rate limiter    | Redis connection active (or stub not in production) |
| Replay cache    | Redis connection active (or stub not in production) |
| Crypto provider | Ed25519 sign/verify round-trip succeeds             |

```typescript
if (process.env.NODE_ENV === 'production') {
  enforceStubGuard('ReplayCache', replayCache);
}
```

## Alerting Thresholds

Every alert must have an owner and link to a runbook.

| Signal                                               | Alert Condition       | Severity |
| ---------------------------------------------------- | --------------------- | -------- |
| `gtcx_auth_failures_total`                           | > 50/minute sustained | P2       |
| `gtcx_lockout_events_total`                          | > 10/minute           | P2       |
| `gtcx_pvp_replay_check_total{result=rejected}`       | > 5/minute            | P1       |
| `gtcx_audit_chain_verify_duration_ms p99`            | > 1000ms              | P3       |
| Any protocol duration p99 > target × 2               |                       | P3       |
| `gtcx_store_connection_errors_total{store=redis}`    | Any                   | P2       |
| `gtcx_store_connection_errors_total{store=postgres}` | Any                   | P1       |

## Production Store Observability

When Redis or Postgres become unavailable, the protocol layer emits error-level logs and the counters above. The fail-open / fail-closed behavior is determined by the policy in [production-store-integration.md](production-store-integration.md).

## Reference

- [incident-response.md](incident-response.md)
- [production-store-integration.md](production-store-integration.md)
- [docs/reference/performance-slos.md](../../reference/performance-slos.md)
- [\docs/decisions/002-in-memory-stub-guards.md](../../decisions/002-in-memory-stub-guards.md)
