---
title: 'Service Level Indicators + Objectives'
status: 'current'
date: '2026-05-27'
owner: 'platform-engineering'
tier: 'critical'
tags: ['operations', 'slo', 'sli', 'observability', 'compliance']
review_cycle: 'quarterly'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Service Level Indicators (SLIs) + Objectives (SLOs)

Per ADR-016 (fail-closed audit signing) and ADR-017 (adaptive policy tuning), the substrate behaves differently under degraded conditions than under healthy ones. SLIs/SLOs are the contract that defines "healthy."

This doc enumerates every SLI we measure, the SLO target for each, and the operational consequences of breaching it. Prometheus recording rules live at [`infra/monitoring/rules/slo-recording-rules.yml`](../../infra/monitoring/rules/slo-recording-rules.yml). Alertmanager routing for SLO burn-rate breaches lives at [`infra/monitoring/alerts/slo-burn-rate-alerts.yml`](../../infra/monitoring/alerts/slo-burn-rate-alerts.yml).

## Why SLIs/SLOs matter for compliance substrate

The substrate's most important property is **that an auditor's claim of "tamper-evident" is load-bearing**. Three SLI categories support that claim:

1. **Availability** — if the gateway is down, no audit records are produced and the chain has gaps. Gaps look like missing evidence to an auditor.
2. **Audit durability** — even if the gateway is up, if records don't reach the WORM bucket, the off-pod copy is missing.
3. **Verification correctness** — even if records are durable, if signatures fail to verify, the chain is structurally broken.

Each category has SLIs at multiple time windows because regulators read evidence at different cadences (hourly during incidents, monthly during reviews, annually during audit).

## SLI Catalog

### Availability SLIs

| SLI ID                                    | What it measures                                                 | Recording rule                         | Target SLO |
| ----------------------------------------- | ---------------------------------------------------------------- | -------------------------------------- | ---------- |
| `sli-availability-agx-30d`                | gtcx-agx successful (non-5xx) HTTP requests over rolling 30 days | `slo:agx:availability:ratio_30d`       | ≥ 99.5%    |
| `sli-availability-protocols-30d`          | gtcx-protocols same                                              | `slo:protocols:availability:ratio_30d` | ≥ 99.5%    |
| `sli-availability-anisa-30d`              | anisa intelligence service same                                  | `slo:anisa:availability:ratio_30d`     | ≥ 99.0%    |
| `sli-availability-compliance-gateway-30d` | compliance-gateway same                                          | TBD — add recording rule               | ≥ 99.5%    |

**Why ≥99.5%:** corresponds to ~3.6 hours of downtime per month. Pilot-grade. Production-grade target moves to 99.9% (~43 minutes / month) once the dual-region failover lands.

### Latency SLIs

| SLI ID                               | What it measures                             | Recording rule                        | Target SLO                                             |
| ------------------------------------ | -------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| `sli-latency-agx-p95`                | gtcx-agx p95 request latency over rolling 1h | `slo:agx:latency:p95_1h`              | < 500ms                                                |
| `sli-latency-agx-p99`                | same, p99                                    | `slo:agx:latency:p99_1h`              | < 1000ms                                               |
| `sli-latency-protocols-p95`          | gtcx-protocols p95                           | `slo:protocols:latency:p95_1h`        | < 500ms                                                |
| `sli-latency-protocols-p99`          | same, p99                                    | `slo:protocols:latency:p99_1h`        | < 1000ms                                               |
| `sli-latency-anisa-p95`              | anisa p95                                    | `slo:anisa:latency:p95_1h`            | < 2000ms                                               |
| `sli-latency-compliance-gateway-p95` | compliance-gateway /v1/query                 | `compliance_gateway_query_latency_ms` | < 5000ms (drives adaptive policy at ADR-017 threshold) |

### Audit substrate SLIs

These are the regulator-facing SLIs. Per ADR-014 (NATS transport) and ADR-016 (fail-closed), each measures a specific property of the tamper-evident claim.

| SLI ID                            | What it measures                                                | Recording rule                                                                                                                       | Target SLO                                                             |
| --------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `sli-audit-signing-active`        | Fraction of /v1/query calls that produced a signed audit record | `compliance_gateway_audit_records_total{action="query:success"} / compliance_gateway_requests_total{route="/v1/query",status="200"}` | = 1.000 (every consequential request signs)                            |
| `sli-audit-sign-failures-rate`    | Signing failures per minute                                     | `rate(compliance_gateway_audit_sign_failures_total[5m])`                                                                             | < 0.001 (one failure per 16+ minutes)                                  |
| `sli-audit-chain-bound-respected` | In-memory chain depth ÷ AUDIT_CHAIN_MAX_RECORDS                 | `compliance_gateway_audit_chain_in_memory / 10000`                                                                                   | < 1.0 (rollover-triggered checkpointing is keeping up)                 |
| `sli-audit-flush-lag`             | Seconds since last successful WORM bucket write                 | `time() - audit_flush_last_success_timestamp_seconds`                                                                                | < 60s (warning); < 300s (critical)                                     |
| `sli-audit-flush-quarantine-rate` | Quarantined batches over rolling 24h                            | `rate(audit_flush_quarantine_total[24h]) * 86400`                                                                                    | < 0.001 batches/day (essentially zero; any quarantine is investigated) |

### Tenant boundary SLIs (Sprint 5 work)

| SLI ID                              | What it measures                                     | Recording rule                                            | Target SLO                |
| ----------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- | ------------------------- |
| `sli-tenant-isolation-leak-rate`    | Cross-tenant data appearances in /v1/query responses | TBD — eval-pipeline mirror                                | 0 (any non-zero is a P0)  |
| `sli-tenant-budget-exhaustion-rate` | 429 responses per tenant over 1h                     | `rate(compliance_gateway_throttle_total[1h])` by tenantId | Informational; not capped |

### Capacity SLIs

| SLI ID                      | What it measures                                | Recording rule                                             | Target SLO                               |
| --------------------------- | ----------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| `sli-hpa-target-attainment` | HPA achieves target replica count within window | TBD — derived from `kube_horizontalpodautoscaler_status_*` | ≥ 95% (HPA matches desired within 2 min) |
| `sli-soak-test-pass`        | k6 soak test pass rate over weekly runs         | CI gate                                                    | ≥ 1.0 (any failure blocks release)       |

## Error Budgets

Per the [Google SRE workbook](https://sre.google/workbook/implementing-slos/) convention, error budgets are derived from `1 - SLO`. Burn rate determines escalation.

| SLO                   | Monthly budget (30 days)                     | Burn rate alert thresholds                                                                     |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| availability ≥ 99.5%  | 3h 36m of failure permitted                  | 14.4× burn → page (2% budget in 1h); 6× burn → ticket (5% in 6h); 2× burn → notice (10% in 3d) |
| latency p95 < 500ms   | 5% of requests permitted over budget         | 14.4× / 6× / 2× same scale                                                                     |
| audit signing = 1.000 | **zero budget** — every miss is investigated | Any sign-failure increments the audit-anomaly alert (immediate)                                |
| audit flush lag < 60s | 5% of time window permitted                  | At 5 min sustained lag → critical                                                              |

Burn-rate alerting is wired in [`infra/monitoring/rules/slo-recording-rules.yml`](../../infra/monitoring/rules/slo-recording-rules.yml) (existing) + Alertmanager routing.

## Operational Consequences of Breach

| SLO breached                                      | Immediate action                                                                                                                              | Escalation path                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Availability ≥ 99.5% (any 1h window > 14.4× burn) | On-call paged; gateway logs reviewed; rollback if recent deploy                                                                               | If unresolved 30 min → Eng Lead; 60 min → CTO |
| Audit signing < 1.000                             | **All-hands incident.** Gateway has either failed open (P0 ADR-016 contract violation) or has lost broker connectivity (P0 substrate breach). | Per `docs/security/break-glass-procedure.md`  |
| Audit flush lag > 300s                            | audit-flush sidecar logs reviewed; NATS broker health checked                                                                                 | If unresolved 15 min → Platform Eng Lead      |
| HPA target unmet                                  | Cluster capacity check; CRI runtime check; scheduler debug                                                                                    | Platform Eng                                  |
| Soak test fail in CI                              | Release blocked; failure mode triaged before merge                                                                                            | Release manager                               |

## Operational Drills

Quarterly DR drill validates RTO/RPO under each SLO:

- **DR drill cadence:** quarterly, per `.github/workflows/dr-test-quarterly.yml`
- **Synthetic-incident drill:** on-call drill template at `docs/devops/drills/drill-002-replay-guard-failure-2026-05-17.md`
- **Audit-chain restore drill:** pull random WORM object → reconstruct chain → verify → log timing. Cadence: monthly. Owned by Security Lead.

## Auditor-facing reading order

A regulator's SOC 2 Type 1 or pen-test auditor verifies SLO compliance by:

1. Reading this doc to learn the targets.
2. Querying Prometheus for each `slo:*` recording rule against the relevant window.
3. Cross-referencing against [`docs/audit/score-evidence-ledger.json`](../audit/score-evidence-ledger.json) entries for the period.
4. Spot-checking the `compliance_gateway_audit_records_total{action="query:success"}` series against `compliance_gateway_requests_total{route="/v1/query",status="200"}` for the 100% audit-signing SLO.

Every series above is exposed at `/metrics` on every gateway + sidecar pod. No vendor-specific instrumentation required.

## Related

- ADR-014 — NATS JetStream audit transport (audit flush lag SLO is the durability contract)
- ADR-016 — Fail-closed audit signing (the 1.000 signing SLO is the contract)
- ADR-017 — Adaptive policy tuning (latency p95 < 5000ms drives the auto-degrade behavior)
- [`docs/audit/repo-overlay.md`](../audit/repo-overlay.md) — repo-specific stricter caps
- [`docs/audit/full-audit-2026-05-22.md`](../audit/full-audit-2026-05-22.md) Phase 5 — production readiness assessment
- [`docs/operations/runbooks/`](./runbooks/) — 25 operational runbooks covering each escalation path
- Google SRE workbook on SLOs: https://sre.google/workbook/implementing-slos/
