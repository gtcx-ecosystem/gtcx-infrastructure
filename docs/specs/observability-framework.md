# GTCX Observability Framework

| Field   | Value                                                                                   |
| ------- | --------------------------------------------------------------------------------------- |
| Scope   | All production services across the GTCX ecosystem                                       |
| Status  | Specification                                                                           |
| Related | [Resilience Framework](./resilience-framework.md), [CI/CD Pipeline](./cicd-pipeline.md) |

## Design Principles

1. **Every service emits structured metrics, logs, and traces** -- Observability is not optional. A service without telemetry is a black box that cannot be operated, debugged, or trusted.
2. **Alert on symptoms, not causes** -- Error rate and latency tell you the system is broken. CPU and memory tell you why. Alert on the former; investigate with the latter.
3. **Observability data is append-only and tamper-evident** -- Compliance demands provable audit trails. All telemetry is hash-chained and stored in immutable append-only logs.
4. **PII is never written to logs or metrics** -- Every log entry, metric label, and trace attribute must pass through PII redaction before emission. No exceptions.

## Three Pillars

```
┌──────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY STACK                       │
├───────────────────┬──────────────────┬───────────────────────┤
│     METRICS       │      LOGS        │       TRACES          │
│   Prometheus      │   Structured     │    OpenTelemetry      │
│   → Grafana       │   JSON → Loki    │    → Jaeger           │
├───────────────────┼──────────────────┼───────────────────────┤
│  request_rate     │  correlation     │  cross-service        │
│  error_rate       │  IDs per         │  request flow         │
│  latency_p99      │  request         │  with timing          │
│  saturation       │  PII redacted    │  per span             │
├───────────────────┼──────────────────┼───────────────────────┤
│  Retention: 90d   │  Retention: 30d  │  Retention: 14d       │
│  Resolution: 15s  │  (audit: 7 yr)   │  (sampled)            │
└───────────────────┴──────────────────┴───────────────────────┘
```

All three pillars are correlated via `traceId` and `correlationId`. A single request can be traced from metric anomaly → log entry → distributed trace span.

## Service Metrics Catalog

Every service in the ecosystem emits the following base metrics. Protocol-specific metrics are additive (see next section).

| Service        | Key Metrics                                                                 | Error Alert Threshold        | Latency Alert (p99) |
| -------------- | --------------------------------------------------------------------------- | ---------------------------- | ------------------- |
| PvP Settlement | request_total, request_duration_seconds, error_total, active_settlements    | error_rate > 0.1% for 5 min  | > 2s for 5 min      |
| PANX Consensus | request_total, request_duration_seconds, error_total, active_validators     | error_rate > 0.05% for 5 min | > 5s for 5 min      |
| TradePass      | request_total, request_duration_seconds, error_total, active_sessions       | error_rate > 0.1% for 5 min  | > 1s for 5 min      |
| GeoTag         | request_total, request_duration_seconds, error_total, proofs_pending        | error_rate > 0.1% for 5 min  | > 1s for 5 min      |
| GCI Scoring    | request_total, request_duration_seconds, error_total, scores_pending        | error_rate > 0.1% for 5 min  | > 3s for 5 min      |
| VaultMark      | request_total, request_duration_seconds, error_total, custody_chains_active | error_rate > 0.1% for 5 min  | > 1s for 5 min      |
| CRX Platform   | request_total, request_duration_seconds, error_total, active_connections    | error_rate > 0.5% for 5 min  | > 2s for 5 min      |
| SGX Platform   | request_total, request_duration_seconds, error_total, active_connections    | error_rate > 0.5% for 5 min  | > 2s for 5 min      |
| AGX Platform   | request_total, request_duration_seconds, error_total, active_connections    | error_rate > 0.5% for 5 min  | > 2s for 5 min      |
| Cortex         | request_total, request_duration_seconds, error_total, pipeline_consumers    | error_rate > 1% for 15 min   | > 10s for 15 min    |
| ANISA          | request_total, request_duration_seconds, error_total, guidance_sessions     | error_rate > 1% for 15 min   | > 5s for 15 min     |

**Metric naming**: All metrics follow Prometheus naming conventions -- `snake_case`, unit suffix (`_seconds`, `_bytes`, `_total`), base units (seconds not milliseconds, bytes not kilobytes).

## Protocol-Specific Metrics

| Protocol  | Metric                                  | Type      | Description                                                               |
| --------- | --------------------------------------- | --------- | ------------------------------------------------------------------------- |
| TradePass | tradepass_credentials_issued_total      | counter   | Total credentials issued, labeled by `jurisdiction` and `commodity_type`  |
| TradePass | tradepass_verification_duration_seconds | histogram | Time to verify a credential, buckets: 0.005, 0.01, 0.025, 0.05, 0.1, 0.25 |
| TradePass | tradepass_credentials_active            | gauge     | Currently valid (non-expired) credentials                                 |
| GeoTag    | geotag_proofs_captured_total            | counter   | Location proofs captured, labeled by `jurisdiction` and `source`          |
| GeoTag    | geotag_proof_size_bytes                 | histogram | Proof payload size distribution                                           |
| GCI       | gci_score_distribution                  | histogram | Score distribution, buckets: 0.1 increments from 0 to 1.0                 |
| GCI       | gci_signals_processed_total             | counter   | Input signals processed, labeled by `signal_type`                         |
| VaultMark | vaultmark_custody_transfers_total       | counter   | Custody chain transfers, labeled by `commodity_type`                      |
| VaultMark | vaultmark_chain_length                  | histogram | Number of transfers in active custody chains                              |
| PvP       | pvp_settlement_duration_seconds         | histogram | End-to-end settlement time, buckets: 0.1, 0.25, 0.5, 1, 2, 5              |
| PvP       | pvp_settlement_value_total              | counter   | Total value settled (labeled by `currency`)                               |
| PvP       | pvp_settlement_failures_total           | counter   | Failed settlements, labeled by `failure_reason`                           |
| PANX      | panx_consensus_rounds_total             | counter   | Consensus rounds completed                                                |
| PANX      | panx_quorum_margin                      | gauge     | Active validators above minimum quorum threshold                          |
| PANX      | panx_attestation_queue_depth            | gauge     | Pending attestations awaiting consensus                                   |
| Cortex    | cortex_pipeline_lag_seconds             | gauge     | Seconds behind real-time for streaming pipeline                           |
| Cortex    | cortex_events_processed_total           | counter   | Events processed, labeled by `event_type` and `pipeline`                  |

## Structured Logging Format

Every log entry across the ecosystem conforms to this JSON schema:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "info",
  "service": "pvp-settlement",
  "version": "1.2.0",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "message": "Settlement completed successfully",
  "context": {
    "settlementId": "stl_abc123",
    "duration_ms": 142,
    "jurisdiction": "GH"
  },
  "piiRedacted": true
}
```

| Level | Usage                                                                               | Production | Staging |
| ----- | ----------------------------------------------------------------------------------- | ---------- | ------- |
| DEBUG | Internal state, variable values, step-by-step execution                             | Disabled   | Enabled |
| INFO  | Request lifecycle: received, processing, completed                                  | Enabled    | Enabled |
| WARN  | Degraded operation: fallback triggered, retry attempted, slow query                 | Enabled    | Enabled |
| ERROR | Failed operation requiring attention: unhandled exception, external service failure | Enabled    | Enabled |

**Correlation**: Every inbound request generates a `correlationId` (UUID v4) at the API gateway. This ID propagates through all downstream service calls via the `X-Correlation-ID` header and appears in every log entry for that request.

## PII Redaction Rules

| Field Type       | Example Input         | Redaction Strategy            | Log Output             |
| ---------------- | --------------------- | ----------------------------- | ---------------------- |
| MSISDN           | +233201234567         | SHA-256 hash + last 4 digits  | `sha256:a1b2c3...4567` |
| Email            | user@example.com      | SHA-256 hash                  | `sha256:d4e5f6...`     |
| Name             | Kwame Asante          | Omit entirely                 | `[REDACTED]`           |
| Physical address | 123 Trade Road, Accra | Omit entirely                 | `[REDACTED]`           |
| GPS coordinates  | 5.6037, -0.1870       | Reduce precision to 1 decimal | `5.6, -0.2`            |
| DID              | did:gtcx:abc123       | Preserve (not PII)            | `did:gtcx:abc123`      |
| TradePassId      | tp_xyz                | Preserve (not PII)            | `tp_xyz`               |
| Settlement ID    | stl_abc123            | Preserve (not PII)            | `stl_abc123`           |
| IP address       | 192.168.1.100         | Hash full address             | `sha256:f7g8h9...`     |

**Implementation**: PII redaction is handled by a shared logging middleware (`@gtcx/logger`) that applies field-level redaction rules before serialization. Application code never manually redacts -- the middleware is the single enforcement point.

## Distributed Tracing

| Aspect                | Specification                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------ |
| SDK                   | OpenTelemetry SDK (JS, Python, Rust)                                                       |
| Propagation           | W3C Trace Context headers (`traceparent`, `tracestate`)                                    |
| Backend               | Jaeger with Elasticsearch storage                                                          |
| Sampling (production) | 100% for errors; 10% for successful requests                                               |
| Sampling (staging)    | 100% for all requests                                                                      |
| Span attributes       | `service.name`, `protocol.type`, `jurisdiction`, `commodity.type`, `user.role` (never PII) |
| Trace retention       | 14 days (production), 7 days (staging)                                                     |

**Cross-service flow**: A single verification request may traverse: API Gateway → Platform API → Protocol SDK → Crypto Library → HSM. Each boundary creates a child span, producing a complete timing waterfall for every request.

## Dashboards

| Dashboard           | Audience                  | Key Panels                                                                                            | Refresh Rate |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- | ------------ |
| Ecosystem Overview  | Engineering leadership    | Service health map, error budget burn rate, deployment activity, open incidents                       | 1 min        |
| Protocol Health     | Protocol engineering team | Verification rates per protocol, consensus metrics, settlement status, queue depths                   | 30s          |
| Platform Operations | Platform engineering team | User activity, API latency histograms, error rates by endpoint, WebSocket connections                 | 30s          |
| Field Operations    | Field operations team     | Device connectivity map, offline queue depth, sync backlog, last-seen timestamps                      | 1 min        |
| Security            | Security team             | Authentication failure rate, anomaly detection alerts, vulnerability scan status, audit log integrity | 1 min        |
| Jurisdiction        | Country operations lead   | Per-jurisdiction service health, local compliance metrics, data residency verification                | 5 min        |

All dashboards are defined as code (Grafana JSON models) and version-controlled in `gtcx-infrastructure/monitoring/dashboards/`.

## Alerting Strategy

Alerts are symptom-based. High CPU is a diagnostic signal, not an alert condition. High error rate is an alert condition.

### Error Budget Burn Rate Alerts

| Burn Rate | Window  | Condition                                                  | Action                            | Notification       |
| --------- | ------- | ---------------------------------------------------------- | --------------------------------- | ------------------ |
| 14.4x     | 1 hour  | Service will exhaust 30-day budget in 2 days at this rate  | Page on-call engineer immediately | PagerDuty critical |
| 6x        | 6 hours | Service will exhaust 30-day budget in 5 days at this rate  | Alert team Slack channel          | Slack #gtcx-alerts |
| 1x        | 3 days  | Service is consuming budget at expected rate but sustained | Create tracking ticket            | Jira auto-create   |

### Alert Routing

| Severity | Channel                   | Response Time     | Escalation                              |
| -------- | ------------------------- | ----------------- | --------------------------------------- |
| Critical | PagerDuty → on-call phone | 5 min ack         | Auto-escalate to team lead after 15 min |
| Warning  | Slack #gtcx-alerts        | 30 min ack        | Escalate to on-call after 2 hours       |
| Info     | Slack #gtcx-ops           | Next business day | None                                    |

Alert definitions are version-controlled in `gtcx-infrastructure/monitoring/alerts/` as Prometheus alerting rules.

## Audit Trail as Telemetry

| Aspect       | Specification                                                                            |
| ------------ | ---------------------------------------------------------------------------------------- |
| Scope        | Every verification event, settlement, custody transfer, and identity issuance            |
| Format       | Structured JSON, same schema as logging with additional `auditType` field                |
| Integrity    | Entries are append-only and hash-chained (each entry includes SHA-256 of previous entry) |
| Storage      | Dedicated audit log store, separate from operational logs                                |
| Retention    | 7 years minimum (commodity trade compliance requirement)                                 |
| Verification | Daily integrity check: replay hash chain, verify no gaps or mutations                    |
| Access       | Read-only for all services; write via dedicated audit service only                       |

**Hash chain structure**:

```
Entry N:   { ..., hash: SHA256(payload_N + hash_{N-1}), prevHash: hash_{N-1} }
Entry N+1: { ..., hash: SHA256(payload_{N+1} + hash_N), prevHash: hash_N }
```

Any modification to a historical entry breaks the chain, and the daily integrity check detects it.

## Deep Dives

- [Resilience Framework](./resilience-framework.md) -- SLOs, error budgets, and alerting thresholds that drive observability configuration
- [Security Policies](../security/policies-overview.md) -- Audit requirements, data protection standards, and PII handling rules
- [Infrastructure Architecture](../architecture/infrastructure-architecture-overview.md) -- Deployment topology, Kubernetes configuration, and monitoring infrastructure
- [Data Protection](../security/data-protection.md) -- Data classification and retention policies governing telemetry storage
- [Ecosystem Architecture](../../../docs/architecture/ecosystem-architecture-overview.md) -- Service topology and cross-service dependencies
