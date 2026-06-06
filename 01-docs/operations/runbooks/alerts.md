---
title: 'Alert Runbooks'
status: 'current'
date: '2026-05-30'
owner: 'infrastructure-lead'
tier: 'critical'
tags: ['runbook', 'alerts', 'incident-response']
review_cycle: 'on-change'
---

# Alert Runbooks

Each Prometheus alert in `04-ship/monitoring/alerts/` has its `runbook_url`
annotation pointing at a section below. **Operators arriving here from a
PagerDuty page should be able to identify the alert, the immediate impact,
the triage steps, and the mitigation in under 60 seconds.**

When a new alert is added, the next on-call rotation owns filling in the
matching section here. The `pnpm test` gate (via
`03-platform/tools/scripts/alerts-add-runbook-url.mjs --check`) enforces the
`runbook_url` annotation; the section content is enforced by code review.

Section anchors are derived from the alert name lowercased
(`ProtocolHighErrorRate` → `protocolhigherrorrate`). GitHub Markdown
anchor rules apply.

---

## Template

```
### <AlertName>

| Field    | Value                                                           |
| -------- | --------------------------------------------------------------- |
| Severity | <critical / high / warning>                                     |
| Source   | `04-ship/monitoring/alerts/<file>.yml`                            |
| Impact   | <one sentence on what the user sees if this fires>              |

**Detection signal:** <metric + threshold>

**Triage (5 min):**
1. <first thing to check>
2. <next>
3. <next>

**Mitigation:**
- <action 1>
- <action 2>

**Escalation:** <when to page the next tier>
```

---

## Protocol alerts

### protocolhigherrorrate

| Field    | Value                                           |
| -------- | ----------------------------------------------- |
| Severity | critical                                        |
| Source   | `04-ship/monitoring/alerts/protocol-alerts.yml` |
| Impact   | A protocol handler is failing >5% of requests   |

**Detection signal:** `gtcx_protocol_errors_total / gtcx_protocol_requests_total > 0.05` for 5m.

**Triage (5 min):**

1. Check the affected protocol's recent deploys: `kubectl rollout history deployment/<protocol> -n gtcx`.
2. Inspect logs for the failing handler: `kubectl logs -n gtcx -l app=<protocol> --tail=200`.
3. Verify upstream dependencies (DB, NATS, KMS) are healthy via `/health` endpoints.

**Mitigation:**

- If a recent deploy correlates: `pnpm ctl deploy rollback --environment=production`. The CLI rolls back the entire environment (per-service rollback isn't supported today); coordinate with the on-call lead before executing in prod.
- If upstream is failing: follow `disaster-recovery.md` for the affected dependency.

**Escalation:** Page protocol-architect-lead if error rate persists >15m after rollback.

### protocolhighlatency

| Field    | Value                                           |
| -------- | ----------------------------------------------- |
| Severity | warning                                         |
| Source   | `04-ship/monitoring/alerts/protocol-alerts.yml` |
| Impact   | p99 latency exceeds 2s — user-visible slowness  |

**Triage:** Check NATS broker latency, DB connection pool saturation, recent traffic spike. Compare against k6 soak baseline in `03-platform/tools/load-tests/`.

### protocolserverdown

| Field    | Value                                           |
| -------- | ----------------------------------------------- |
| Severity | critical                                        |
| Source   | `04-ship/monitoring/alerts/protocol-alerts.yml` |
| Impact   | Total protocol outage                           |

**Triage:** Verify pod status (`kubectl get pods -n gtcx -l app=gtcx-protocols`), check recent ALB target health, inspect node health.

### protocolratelimittriggered

Rate-limit rejections > 10/min. Investigate source IP via access logs; if legitimate traffic, scale HPA upper bound or tune per-principal budget in `03-platform/tools/compliance-gateway/src/budget.mjs`.

### protocolnotraffic

Server up but receiving zero requests for 10m. Check ALB target group, DNS resolution, and upstream consumer health.

### lotproofassemblyfailures

VerifiedLotProof assembly failing. Check `audit-flush` sidecar `/ready`, NATS JetStream consumer lag, and `audit-flush.batch.quarantined` log volume.

---

## Audit trust alerts

### auditeventvolumedropped / auditunusualdidpattern / auditoffhoursactivity / auditburstdetected / auditmerklerootmismatch

See `04-ship/monitoring/alerts/audit-anomaly.yml` and `audit-trust-alerts.yml`. These detect tampering attempts or operational anomalies in the audit chain. **Any merkle root mismatch is a stop-ship event** — escalate to security-engineer-lead immediately and stop ingest until investigated. Sections below to be expanded by the next on-call rotation.

---

## Intelligence alerts

`intelligence-alerts.yml` — covers IntelligenceHighErrorRate, IntelligenceElevatedErrorRate, AnisaHighLLMLatency, AnisaElevatedLLMLatency, CortexBufferNearFull, CortexBufferElevated, VeritasAnomalousMatchRate, VeritasElevatedMatchRate, PanxConsensusStale, PanxConsensusAging, IntelligenceServiceDegraded, IntelligenceCircuitBreakerTripped.

For LLM-tier alerts: check `compliance_gateway_cost_usd_total`, the provider fallback chain state at `/v1/providers`, and per-principal budget exhaustion in `/v1/budget`.

For ANISA/Cortex/Veritas/PANX: see the corresponding intelligence service runbook (TBD per service — to be expanded as the intelligence stack lands).

---

## SLO burn-rate alerts

`slo-burn-rate-alerts.yml` — multi-window burn-rate alerts on AGX/Protocols/ANISA. Fast burn (`SLOFastBurn*`) → page; slow burn (`SLOSlowBurn*`) → Slack.

**For any fast-burn page:** consult the SLO dashboard (`04-ship/monitoring/dashboards/gtcx-slo-dashboard.json`) to identify the contributing endpoint, then follow the protocol or intelligence runbook for that service.

### slolatencybreachagx

p99 latency breach on AGX. Compare against the recent deploy timeline; common cause is a slow downstream dependency added in the latest deploy.

---

## Replay-protection alerts

`replay-protection-alerts.yml` — covers rejection counters (nonce, envelope, signature, future/stale clock). A sustained spike in `rejected_envelope_total` is a strong tampering signal; spike in `rejected_nonce_total` is replay-attack evidence.

---

## How to add a new alert section

1. Add the alert to `04-ship/monitoring/alerts/<area>.yml`.
2. Run `node 03-platform/tools/scripts/alerts-add-runbook-url.mjs` to add the `runbook_url` annotation.
3. Add a section here under the matching area, using the template above. Anchor matches the alertname lowercased.
4. Commit both in one change.

`pnpm test` will fail if any alert is missing the `runbook_url` annotation. `pnpm test` also fails if any `runbook_url` points at an anchor that doesn't exist below — see `03-platform/tools/scripts/alerts-add-runbook-url.mjs --check`.

---

## Stub sections — runbook content TBD

> The following sections were anchor-backfilled on 2026-05-31 so the
> `runbook_url` anchor-existence gate could be turned on. Each stub names
> the alert and links to the corresponding rule file. The next on-call
> rotation that pages on one of these alerts owns filling in the
> "What it means / Triage / Mitigation" content using the template at the
> top of this file. Remove the `STUB` marker after filling in.

### anisaelevatedllmlatency

STUB — see `04-ship/monitoring/alerts/anisa-error-budget.yml`.

### anisahighllmlatency

STUB — see `04-ship/monitoring/alerts/anisa-error-budget.yml`.

### auditburstdetected

STUB — see `04-ship/monitoring/alerts/audit-trust-alerts.yml`.

### auditdbwritefailure

STUB — see `04-ship/monitoring/alerts/audit-trust-alerts.yml`.

### auditeventvolumedrop

STUB — see `04-ship/monitoring/alerts/audit-trust-alerts.yml`.

### auditeventvolumedropped

STUB — see `04-ship/monitoring/alerts/audit-trust-alerts.yml`.

### auditmerklerootmismatch

STUB — see `04-ship/monitoring/alerts/audit-trust-alerts.yml`.

### auditoffhoursactivity

STUB — see `04-ship/monitoring/alerts/audit-trust-alerts.yml`.

### auditunusualdidpattern

STUB — see `04-ship/monitoring/alerts/audit-trust-alerts.yml`.

### cortexbufferelevated

STUB — see `04-ship/monitoring/alerts/intelligence-circuit-breakers.yml`.

### cortexbuffernearfull

STUB — see `04-ship/monitoring/alerts/intelligence-circuit-breakers.yml`.

### intelligencecircuitbreakertripped

STUB — see `04-ship/monitoring/alerts/intelligence-circuit-breakers.yml`.

### intelligenceelevatederrorrate

STUB — see `04-ship/monitoring/alerts/intelligence-error-rate.yml`.

### intelligencehigherrorrate

STUB — see `04-ship/monitoring/alerts/intelligence-error-rate.yml`.

### intelligenceservicedegraded

STUB — see `04-ship/monitoring/alerts/intelligence-error-rate.yml`.

### panxconsensusaging

STUB — see `04-ship/monitoring/alerts/panx-consensus.yml`.

### panxconsensusstale

STUB — see `04-ship/monitoring/alerts/panx-consensus.yml`.

### replayenvelopemismatchspike

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### replayextendedwindowusage

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### replayfuturetimestampspike

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### replayguardclockskewhigh

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### replayguarddown

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### replayguardhighrejectionrate

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### replayguardredisunavailable

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### replayprotectionspike

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### replaysignaturefailurespike

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### replaystaletimestampspike

STUB — see `04-ship/monitoring/alerts/replay-protection-alerts.yml`.

### slofastburnagx

STUB — see `04-ship/monitoring/alerts/slo-burn-rate-alerts.yml`.

### slofastburnanisa

STUB — see `04-ship/monitoring/alerts/slo-burn-rate-alerts.yml`.

### slofastburnprotocols

STUB — see `04-ship/monitoring/alerts/slo-burn-rate-alerts.yml`.

### slolatencybreachanisa

STUB — see `04-ship/monitoring/alerts/slo-burn-rate-alerts.yml`.

### slolatencybreachprotocols

STUB — see `04-ship/monitoring/alerts/slo-burn-rate-alerts.yml`.

### sloslowburnagx

STUB — see `04-ship/monitoring/alerts/slo-burn-rate-alerts.yml`.

### sloslowburnanisa

STUB — see `04-ship/monitoring/alerts/slo-burn-rate-alerts.yml`.

### sloslowburnprotocols

STUB — see `04-ship/monitoring/alerts/slo-burn-rate-alerts.yml`.

### veritasanomalousmatchrate

STUB — see `04-ship/monitoring/alerts/veritas-anomaly.yml`.

### veritaselevatedmatchrate

STUB — see `04-ship/monitoring/alerts/veritas-anomaly.yml`.

### compliancegatewayllmhighlatency

STUB — see `04-ship/monitoring/alerts/llm-ops-alerts.yml`. Check Grafana LLM Ops dashboard; review provider latency and cost-router fallback.

### compliancegatewayllmhigherrorrate

STUB — see `04-ship/monitoring/alerts/llm-ops-alerts.yml`. Inspect compliance-gateway logs and `/v1/query` error metrics; verify API keys and provider health.

### compliancegatewayllmdailycostanomaly

STUB — see `04-ship/monitoring/alerts/llm-ops-alerts.yml`. Compare `baseline cost-stats` export with `compliance_gateway_cost_usd_total`; tune routing thresholds.
