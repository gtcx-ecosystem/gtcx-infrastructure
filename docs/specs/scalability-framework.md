# GTCX Scalability Framework

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

| Field   | Value                                                                                                      |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| Scope   | All production services across the GTCX ecosystem                                                          |
| Status  | Specification                                                                                              |
| Related | [Resilience Framework](./resilience-framework.md), [Observability Framework](./observability-framework.md) |

## Design Principles

1. **Architecture handles 10x growth without redesign** -- Every capacity decision is evaluated against a 10x multiplier. If the current design breaks at 10x, the design is wrong today.
2. **Performance degrades linearly, not exponentially, under load** -- Overload produces queuing and increased latency, never cascading failure or data corruption.
3. **New commodities and jurisdictions are configuration, not code changes** -- The protocol layer is commodity-agnostic by design. Expanding to a new commodity or jurisdiction requires configuration and infrastructure provisioning only.
4. **Stateless services scale horizontally; state is isolated in managed stores** -- Application pods hold no local state. All durable state lives in PostgreSQL, Redis, or NATS JetStream.

## Capacity Targets

| Metric                    | Current Target | 10x Target | Primary Bottleneck                   | Mitigation at 10x                                           |
| ------------------------- | -------------- | ---------- | ------------------------------------ | ----------------------------------------------------------- |
| Protocol verification TPS | 50,000         | 500,000    | CPU (Ed25519 signature verification) | Horizontal pod scaling + batch verification                 |
| Concurrent platform users | 10,000         | 100,000    | WebSocket connections per node       | Connection-based autoscaling + sticky sessions              |
| Daily attestations        | 1,000,000      | 10,000,000 | Database write throughput            | Table partitioning + write replicas                         |
| GCI scoring requests/sec  | 5,000          | 50,000     | Scoring engine CPU                   | Horizontal scaling + score caching                          |
| Cortex events/sec         | 10,000         | 100,000    | Streaming pipeline throughput        | NATS JetStream partitioning + consumer groups               |
| Storage growth/month      | 100 GB         | 1 TB       | Object storage capacity              | S3-compatible object storage (unlimited) + archival tiering |
| Edge sites                | 50             | 500        | Device management complexity         | Ansible automation + fleet management tooling               |

## Horizontal Scaling Architecture

```
                       ┌──────────────────┐
                       │  Load Balancer   │
                       │   (L7 / nginx)   │
                       └────────┬─────────┘
                                │
               ┌────────────────┼────────────────┐
               │                │                │
          ┌────┴─────┐    ┌────┴─────┐    ┌────┴─────┐
          │Service-1 │    │Service-2 │    │Service-N │   Stateless
          │  (pod)   │    │  (pod)   │    │  (pod)   │   replicas
          └────┬─────┘    └────┬─────┘    └────┬─────┘
               │                │                │
               └────────────────┼────────────────┘
                                │
               ┌────────────────┼────────────────┐
               │                │                │
          ┌────┴─────┐    ┌────┴─────┐    ┌────┴─────┐
          │ Postgres  │    │  Redis   │    │   NATS   │   Managed
          │ Primary   │    │ Cluster  │    │ Cluster  │   state
          │ + Replica │    │ (HA)     │    │ (JS)     │   stores
          └──────────┘    └──────────┘    └──────────┘
```

**Scaling invariant**: Adding a pod increases throughput linearly. If adding a 4th pod to a 3-pod service does not yield ~33% throughput increase, there is a shared-state bottleneck that must be resolved before scaling further.

## Service Scaling Profiles

| Service                    | Scaling Strategy       | Min Replicas      | Max Replicas | Scale Trigger                     | Cooldown |
| -------------------------- | ---------------------- | ----------------- | ------------ | --------------------------------- | -------- |
| Protocol Verification      | HPA (CPU-based)        | 3                 | 20           | CPU > 70% avg over 2 min          | 5 min    |
| Platform API (CRX/SGX/AGX) | HPA (connection-based) | 3                 | 15           | Active connections > 80% capacity | 3 min    |
| GCI Scoring                | HPA (CPU-based)        | 2                 | 12           | CPU > 70% avg over 2 min          | 5 min    |
| PANX Consensus             | Fixed (validator set)  | Per quorum config | N/A          | Manual only (validator addition)  | N/A      |
| Cortex Pipeline            | HPA (lag-based)        | 2                 | 10           | Pipeline lag > 30s                | 10 min   |
| ANISA Guidance             | HPA (CPU-based)        | 2                 | 8            | CPU > 70% avg over 2 min          | 5 min    |
| Edge Proxy                 | Fixed (per-site)       | 1 per site        | 1 per site   | N/A (hardware-bound)              | N/A      |

**Pod disruption budgets**: All services with >= 3 replicas maintain a PDB of `maxUnavailable: 1` to ensure availability during rolling updates and node maintenance.

## Database Scaling

| Strategy           | When to Apply                                | Implementation                                                                                 | Monitoring                                  |
| ------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Connection pooling | Always (default)                             | PgBouncer per jurisdiction; 100 connections per pool; transaction-mode pooling                 | Pool saturation gauge; alert at 80%         |
| Read replicas      | Read-heavy workloads (analytics, dashboards) | 2 async replicas per jurisdiction; read traffic routed via read-only connection string         | Replication lag; alert at 1s                |
| Table partitioning | Verification records > 100M rows             | Partition by `jurisdiction` + `month`; automated partition creation via pg_partman             | Partition size; oldest unarchived partition |
| Write optimization | Bulk attestation processing                  | Batch inserts (1,000 rows per transaction); prepared statements; minimal indexes on write path | Write latency p99; WAL size                 |
| Archival           | Records > 2 years old                        | Move to cold storage (S3-compatible); retain index in primary for lookup; async archival job   | Archive lag; cold storage query latency     |
| Vertical scaling   | All strategies exhausted                     | Increase instance size (last resort)                                                           | All of the above                            |

**Connection string routing**: Application code uses two connection strings per jurisdiction -- `DATABASE_URL` (primary, read-write) and `DATABASE_URL_READONLY` (replica, read-only). Query routing is explicit in repository layer, not automatic.

## Caching Strategy

| Cache Layer                 | Store               | TTL                                        | Invalidation                                   | Hit Rate Target       |
| --------------------------- | ------------------- | ------------------------------------------ | ---------------------------------------------- | --------------------- |
| Session/token cache         | Redis               | 15 min (session), 5 min (token validation) | Explicit on logout/revocation                  | > 95%                 |
| GCI score cache             | Redis               | 1 hour                                     | Explicit on new evidence submission            | > 80%                 |
| Protocol result cache       | Redis               | 10 min                                     | Explicit on state change                       | > 70%                 |
| Credential validation cache | Redis               | 30 min                                     | Explicit on revocation                         | > 90%                 |
| Static assets               | CDN (Cloudflare)    | 24 hours                                   | Cache-bust on deployment (content hash in URL) | > 99%                 |
| i18n translations           | In-memory (per pod) | Application restart                        | Restart on deployment                          | 100% (loaded at boot) |
| DNS resolution              | Local resolver      | 60s                                        | TTL-based                                      | > 99%                 |

**Cache warming**: On service startup, critical caches (i18n, configuration) are populated before the pod is marked `Ready` in Kubernetes. The readiness probe waits for cache warmup to complete.

## Event-Driven Architecture

```
Producers ──→ NATS JetStream ──→ Consumer Groups ──→ Processors
                    │
              Durable Streams
             (replay on failure)
             (at-least-once delivery)
```

| Event Stream        | Producers               | Consumers                         | Retention | Partitioning         |
| ------------------- | ----------------------- | --------------------------------- | --------- | -------------------- |
| verification.events | All 6 protocol services | Cortex, Audit Service, Analytics  | 30 days   | By jurisdiction      |
| custody.events      | VaultMark               | Compliance Service, Audit Service | 30 days   | By commodity type    |
| settlement.events   | PvP                     | Finance Service, Audit Service    | 90 days   | By jurisdiction      |
| platform.events     | CRX, SGX, AGX           | Analytics, Notification Service   | 7 days    | By platform          |
| identity.events     | TradePass               | Compliance Service, Analytics     | 30 days   | By jurisdiction      |
| consensus.events    | PANX                    | Audit Service, Analytics          | 30 days   | None (single stream) |

**Delivery guarantee**: At-least-once. Consumers must be idempotent. Every event carries a unique `eventId` (UUID v4); consumers deduplicate using a sliding window of processed IDs (Redis SET with TTL matching stream retention).

**Back-pressure**: When a consumer group falls behind by more than 10,000 messages, NATS JetStream signals back-pressure to producers. Producers switch to batch mode, reducing per-message overhead and allowing consumers to catch up.

## Load Testing

| Test Type  | Tool | Frequency     | Duration      | Success Criteria                                                 |
| ---------- | ---- | ------------- | ------------- | ---------------------------------------------------------------- |
| Baseline   | k6   | Every release | 10 min        | Latency <= baseline + 10%; error rate < 0.1%                     |
| Stress     | k6   | Monthly       | 30 min        | Graceful degradation at 2x capacity; no cascading failure        |
| Soak       | k6   | Quarterly     | 24 hours      | No memory leaks; no connection leaks; no performance degradation |
| Spike      | k6   | Quarterly     | 15 min        | Recovery to baseline within 30s of spike end                     |
| Breakpoint | k6   | Quarterly     | Until failure | Document maximum capacity per service                            |

### Load Test Scenarios

| Scenario           | Concurrent Users       | Verification Rate      | Purpose                                             |
| ------------------ | ---------------------- | ---------------------- | --------------------------------------------------- |
| Normal load        | 1,000                  | 50/s                   | Baseline performance characterization               |
| Peak load          | 10,000                 | 500/s                  | Validate capacity targets under expected peak       |
| Burst              | 0 → 5,000 in 60s       | 0 → 250/s in 60s       | Validate autoscaler response time and pod startup   |
| Sustained peak     | 10,000 for 4 hours     | 500/s for 4 hours      | Verify no resource exhaustion under sustained load  |
| Multi-jurisdiction | 5,000 per jurisdiction | 250/s per jurisdiction | Verify jurisdiction isolation under concurrent load |

Load test scripts are version-controlled in `gtcx-infrastructure/load-tests/` and executed via CI (scheduled monthly, on-demand for releases).

## Performance SLOs

| Service               | p50 Latency | p99 Latency | Throughput      | Error Rate | Measurement Point                |
| --------------------- | ----------- | ----------- | --------------- | ---------- | -------------------------------- |
| Protocol verification | 10 ms       | 100 ms      | 50,000/s        | < 0.01%    | SDK function call boundary       |
| Platform API          | 50 ms       | 500 ms      | 5,000/s         | < 0.1%     | HTTP response at load balancer   |
| GCI scoring           | 20 ms       | 200 ms      | 5,000/s         | < 0.01%    | SDK function call boundary       |
| PvP settlement        | 100 ms      | 2s          | 1,000/s         | < 0.001%   | End-to-end settlement completion |
| Cortex analytics      | 500 ms      | 5s          | 10,000 events/s | < 0.1%     | Event processing completion      |
| PANX consensus        | 200 ms      | 3s          | 500 rounds/s    | < 0.001%   | Consensus round completion       |
| ANISA guidance        | 100 ms      | 1s          | 2,000/s         | < 0.1%     | Response generation              |

**SLO measurement**: Performance SLOs are measured continuously via Prometheus metrics and evaluated over 30-day rolling windows. Breach of any SLO consumes error budget per the [Resilience Framework](./resilience-framework.md) burn rate policy.

## Commodity Scaling

The protocol layer is designed to be commodity-agnostic. `commodityType` is a string parameter throughout the stack -- no code changes are required to add a new commodity.

| Configuration Change                  | Files Modified                       | Deployment Required         | Approval                   |
| ------------------------------------- | ------------------------------------ | --------------------------- | -------------------------- |
| Add commodity type                    | `config/commodities.json`            | Config reload (no redeploy) | Product team               |
| Add GCI signal weights for commodity  | `config/gci/signal-weights.json`     | Config reload (no redeploy) | Compliance team            |
| Add compliance criteria for commodity | `config/compliance/{commodity}.json` | Config reload (no redeploy) | Compliance + legal team    |
| Add commodity-specific UI             | `gtcx-design/ui` component library   | Application deployment      | Product + engineering team |

**Commodity registry**: All supported commodities are defined in a central registry (`config/commodities.json`) that is loaded at service startup and refreshable via SIGHUP or API call. The registry includes: commodity code, display name, supported jurisdictions, GCI signal configuration, and compliance domain mapping.

## Jurisdiction Scaling

| Aspect                       | Implementation                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Data sovereignty             | Shared-nothing architecture per jurisdiction; sovereign data never leaves jurisdiction boundary                  |
| Infrastructure isolation     | Independent Terraform state, Kubernetes namespace, database instance, HSM per jurisdiction                       |
| Cross-jurisdiction analytics | Read replicas with anonymized data only; no PII crosses jurisdiction boundaries                                  |
| Edge site scaling            | Each edge site operates independently; add hardware, configure via Ansible, join mesh                            |
| New jurisdiction onboarding  | Copy Terraform environment template → configure jurisdiction values → provision infrastructure → deploy services |

### Adding a New Jurisdiction

| Step | Action                                                            | Owner          | Duration  |
| ---- | ----------------------------------------------------------------- | -------------- | --------- |
| 1    | Legal and compliance review for target jurisdiction               | Legal          | 2-4 weeks |
| 2    | Copy Terraform environment from template                          | Infrastructure | 1 day     |
| 3    | Configure jurisdiction-specific values (networking, HSM, secrets) | Infrastructure | 1-2 days  |
| 4    | Provision infrastructure (`terraform apply`)                      | Infrastructure | 2-4 hours |
| 5    | Deploy services to new jurisdiction                               | Engineering    | 1 day     |
| 6    | Configure jurisdiction in commodity registry                      | Product        | 1 hour    |
| 7    | Run integration test suite against new jurisdiction               | QA             | 1 day     |
| 8    | Compliance verification and sign-off                              | Compliance     | 1-2 weeks |

**No application code changes required**. Jurisdiction is a deployment-time configuration parameter, not a compile-time constant.

## Resource Budgets

| Service               | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage                       |
| --------------------- | ----------- | --------- | -------------- | ------------ | ----------------------------- |
| Protocol Verification | 500m        | 2000m     | 512 Mi         | 1 Gi         | None (stateless)              |
| Platform API          | 250m        | 1000m     | 256 Mi         | 512 Mi       | None (stateless)              |
| GCI Scoring           | 500m        | 2000m     | 512 Mi         | 1 Gi         | None (stateless)              |
| Cortex Pipeline       | 250m        | 1000m     | 512 Mi         | 2 Gi         | None (stateless)              |
| PANX Consensus        | 500m        | 2000m     | 1 Gi           | 2 Gi         | None (stateless)              |
| PostgreSQL            | 2000m       | 4000m     | 4 Gi           | 8 Gi         | 500 Gi SSD (per jurisdiction) |
| Redis                 | 500m        | 1000m     | 2 Gi           | 4 Gi         | None (ephemeral)              |
| NATS                  | 500m        | 1000m     | 1 Gi           | 2 Gi         | 100 Gi SSD (JetStream)        |

**Resource quotas**: Each jurisdiction namespace has a total resource quota preventing runaway scaling. Quota = sum of (max replicas \* limit) for all services + 20% headroom.

## Deep Dives

- [Resilience Framework](./resilience-framework.md) -- SPOF mitigation, degradation tiers, and recovery targets that bound scaling decisions
- [Observability Framework](./observability-framework.md) -- Performance metrics, alerting thresholds, and dashboards for monitoring scaling behavior
- [CI/CD Pipeline](./cicd-pipeline.md) -- Canary deployment and auto-rollback mechanisms that protect against scaling-induced regressions
- [Infrastructure Architecture](../architecture/infrastructure-architecture-overview.md) -- Kubernetes cluster configuration, Terraform structure, and edge deployment topology
- Shared ecosystem architecture guidance informs service topology, three-tier architecture, and the cross-cutting intelligence layer.
