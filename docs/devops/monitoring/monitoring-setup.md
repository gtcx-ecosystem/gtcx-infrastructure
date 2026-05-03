# Monitoring Setup

**Owner**: [Platform / SRE Lead]
**Review Cycle**: Quarterly or after significant infrastructure changes

---

## Observability Strategy

Every production service must be observable across three signals:

| Signal      | Purpose                                                           | Tooling                                |
| ----------- | ----------------------------------------------------------------- | -------------------------------------- |
| **Metrics** | Quantitative health — latency, error rate, throughput, saturation | [Prometheus + Grafana / Datadog]       |
| **Logs**    | Structured event records for debugging and audit                  | [Loki / Datadog Logs / CloudWatch]     |
| **Traces**  | Request flow across services for latency attribution              | [Jaeger / Datadog APM / OpenTelemetry] |

---

## Required Metrics Per Service

Every service must expose the following before shipping to production:

### RED Metrics (Rate, Errors, Duration)

| Metric           | Description                       | Alert Threshold       |
| ---------------- | --------------------------------- | --------------------- |
| Request rate     | Requests per second by endpoint   | Anomaly alert         |
| Error rate       | 4xx + 5xx / total requests        | > 1% over 5 min → P1  |
| Request duration | p50, p95, p99 latency by endpoint | p95 > 500ms → Warning |

### USE Metrics (Utilization, Saturation, Errors) — Infrastructure

| Metric               | Description          | Alert Threshold            |
| -------------------- | -------------------- | -------------------------- |
| CPU utilization      | Per container/pod    | > 80% for 10 min → Warning |
| Memory utilization   | Per container/pod    | > 85% for 5 min → Warning  |
| Database connections | Active / pool max    | > 80% pool → Warning       |
| Queue depth          | Unprocessed messages | > 1000 for 5 min → Warning |
| Disk usage           | Per volume           | > 80% → Warning            |

---

## SLO Definitions

Define SLOs before a service ships. Review quarterly.

### SLO Template

```
Service: gtcx-agx
SLO Window: Rolling 30 days

Availability SLO:
  Target: 99.5% uptime
  Good event: HTTP response in < 2000ms with 2xx status
  Bad event: HTTP response ≥ 500 or timeout
  Error budget: 216 minutes/month downtime allowed

Latency SLO:
  Target: p95 < 500ms for /api/health, /api/v1/*
  Measurement: Prometheus histogram, 5-min windows
```

### Current SLOs

| Service                  | Availability Target | Latency Target (p95) | Error Budget  |
| ------------------------ | ------------------- | -------------------- | ------------- |
| AGX (platform)           | 99.5%               | < 500ms              | 216 min/month |
| Protocols (verification) | 99.5%               | < 1000ms             | 216 min/month |
| ANISA (intelligence)     | 99.0%               | < 2000ms             | 432 min/month |
| Intelligence SDK         | 99.0%               | < 1500ms             | 432 min/month |
| Crypto (signing)         | 99.9%               | < 100ms              | 43 min/month  |

---

## Alerting Rules

### Severity Levels

| Level       | Definition                                          | Response                                   | Channel           |
| ----------- | --------------------------------------------------- | ------------------------------------------ | ----------------- |
| P0 Critical | Service down, data loss, security breach            | Immediate page — all hands                 | PagerDuty + Slack |
| P1 High     | Core flow degraded, SLO breach imminent             | Page on-call within 5 min                  | PagerDuty         |
| P2 Medium   | Performance degraded, non-critical feature down     | Notify in Slack, acknowledge within 30 min | Slack             |
| P3 Low      | Anomaly detected, investigate during business hours | Ticket created automatically               | Slack + Jira      |

### Required Alert Rules

Every production service must have alerts for:

- [ ] Error rate spike (> 1% over 5 minutes)
- [ ] p95 latency breach (> SLO threshold per service)
- [ ] Service unavailable (health check failing)
- [ ] Database connection pool exhaustion
- [ ] Disk space critical (> 80%)
- [ ] Error budget burn rate (> 2x expected rate)
- [ ] Certificate expiry (< 14 days)

---

## Logging Standards

### Structured Logging

All logs must be structured JSON. No unstructured log lines in production.

**Required fields:**

```json
{
  "timestamp": "ISO 8601",
  "level": "info | warn | error | debug",
  "service": "{service-name}",
  "trace_id": "{trace-id}",
  "span_id": "{span-id}",
  "message": "Human-readable summary",
  "...": "Additional context fields"
}
```

### Log Levels

| Level   | When to use                                                                 |
| ------- | --------------------------------------------------------------------------- |
| `error` | Unexpected failures requiring investigation                                 |
| `warn`  | Recoverable issues, deprecated usage, near-threshold conditions             |
| `info`  | Significant business events (request received, job completed, state change) |
| `debug` | Detailed diagnostic info — disabled in production by default                |

### Log Retention

| Environment | Retention                                                   |
| ----------- | ----------------------------------------------------------- |
| Production  | 90 days (per AUDITABLE principle — FATF compliance minimum) |
| Staging     | 30 days                                                     |
| Development | 7 days                                                      |

---

## Dashboards

### Required Dashboards Per Service

Every service must have a dashboard with:

1. **Service Health** — Request rate, error rate, p95 latency (time series, 24h default)
2. **Infrastructure** — CPU, memory, pod count, restarts
3. **Dependencies** — Upstream and downstream service health
4. **Alerts** — Active alerts and recent alert history

### Dashboard Naming Convention

```
[Team] / [Service Name] / [Dashboard Type]
Examples:
  Platform / API Gateway / Service Health
  Platform / API Gateway / Infrastructure
```

---

## Tracing

All inter-service calls must be instrumented with distributed traces.

**Required trace attributes:**

| Attribute          | Value                            |
| ------------------ | -------------------------------- |
| `service.name`     | `{service-name}`                 |
| `http.method`      | HTTP verb                        |
| `http.url`         | Request URL (sanitized — no PII) |
| `http.status_code` | Response code                    |
| `db.statement`     | Query (sanitized — no values)    |

**Sampling rate**: 100% in staging; 10% in production (increase to 100% during incidents).

---

## On-Call

See [runbook-template.md](../2-runbooks/runbook-template.md) for on-call rotation and incident response procedures.

**Monitoring tool access**: All engineers have read access. Write access (creating/editing dashboards, alert rules) requires [Platform / SRE] team approval.
