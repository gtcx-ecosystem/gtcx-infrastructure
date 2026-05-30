---
title: 'GTCX Resilience Framework'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Resilience Framework

| Field   | Value                                                                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope   | All production services across the GTCX ecosystem                                                                                                                                 |
| Status  | Specification                                                                                                                                                                     |
| Related | [Infrastructure Architecture](../architecture/infrastructure-architecture-overview.md), [Security Policy](../security/security-policy.md), shared ecosystem architecture guidance |

## Design Principles

1. **Assume failure at every layer** -- Hardware fails. Networks partition. Software crashes. Design for it.
2. **Degrade gracefully, never halt silently** -- Every service has a defined degradation path from full capability to offline mode.
3. **Recover automatically where possible** -- Automated failover for infrastructure; documented runbooks for everything else.
4. **Offline-first is a resilience strategy** -- 72-hour core autonomy and 45-day hardware operation are not just connectivity features; they are the primary resilience mechanism for frontier deployments.

## Single Points of Failure

### SPOF 1: HSM Signing Infrastructure

| Aspect        | Detail                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Current state | Single HSM instance; unavailability halts all Ed25519 signing operations across the ecosystem      |
| Impact        | No new verifications, no settlement, no identity issuance                                          |
| Mitigation    | Active/standby HSM pair with automated failover (<5s switchover)                                   |
| Fallback      | Software signing module (SoftHSM) with degraded trust level -- signatures marked `trust: software` |
| Monitoring    | HSM heartbeat every 10s; alert on 3 consecutive misses; auto-failover on 5 consecutive misses      |
| Recovery      | Replace failed HSM; re-synchronize key material from standby; validate signing parity              |

### SPOF 2: PostgreSQL Database

| Aspect        | Detail                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Current state | Single-instance PostgreSQL per jurisdiction; no replication                                    |
| Impact        | Total service outage for affected jurisdiction                                                 |
| Mitigation    | Streaming replication with automatic failover via Patroni                                      |
| Topology      | Primary + 2 synchronous replicas per jurisdiction; cross-jurisdiction async replica for DR     |
| RPO           | 0 (synchronous replication within jurisdiction)                                                |
| RTO           | <30s (automated Patroni failover)                                                              |
| Monitoring    | Replication lag alerts at 100ms (warning) and 1s (critical); connection pool saturation at 80% |

### SPOF 3: PANX Validator Quorum

| Aspect               | Detail                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Current state        | BFT consensus requires >2/3 validators online; losing >1/3 halts all consensus operations              |
| Impact               | No new attestations processed; verification truth frozen at last consensus                             |
| Mitigation           | Standby validators with auto-promotion when active validators fail health checks                       |
| Geographic rule      | No single jurisdiction hosts >30% of active validators                                                 |
| Category rule        | Each stakeholder category (government, enterprise, community, academic) maintains at least one standby |
| Graceful degradation | Queue attestations during quorum loss; process backlog on quorum recovery with priority ordering       |
| Monitoring           | Validator health dashboard; quorum margin alerts when active count drops below 80% of total            |

### SPOF 4: Cortex Streaming Pipeline

| Aspect            | Detail                                                                     |
| ----------------- | -------------------------------------------------------------------------- |
| Current state     | Real-time streaming required for market intelligence and anomaly detection |
| Impact            | Stale analytics; missed anomaly alerts; degraded market intelligence       |
| Mitigation        | Batch fallback mode with 4-hour processing window                          |
| Store-and-forward | Events persisted locally in append-only log; replayed on pipeline recovery |
| SLO               | 99.9% streaming uptime; auto-degrade to batch mode at 99.5% threshold      |
| Recovery          | Pipeline restart replays from last committed offset; no data loss          |

## Recovery Targets

| Service               | RTO      | RPO      | Tier     | Justification                                                                      |
| --------------------- | -------- | -------- | -------- | ---------------------------------------------------------------------------------- |
| PvP Settlement        | 30 min   | 0        | Critical | Active financial transactions; atomic settlement cannot tolerate data loss         |
| PANX Consensus        | 1 hour   | 0        | Critical | Verification truth must be consistent; no attestation can be lost                  |
| VaultMark Custody     | 2 hours  | 0        | High     | Chain of custody integrity requires zero data loss                                 |
| TradePass Identity    | 2 hours  | 1 hour   | High     | Identity credentials cached locally; 1-hour RPO acceptable due to offline validity |
| CRX/SGX/AGX Platforms | 4 hours  | 1 hour   | High     | Market operations tolerate brief outages; pending transactions queued              |
| GeoTag Verification   | 4 hours  | 1 hour   | High     | Location proofs cached on device; delayed upload acceptable                        |
| GCI Scoring           | 4 hours  | 4 hours  | Standard | Scores derived from existing data; recalculation possible                          |
| Cortex Analytics      | 24 hours | 4 hours  | Standard | Analytics are informational; batch catch-up recovers insight gap                   |
| ANISA Guidance        | 24 hours | 24 hours | Low      | Cultural intelligence is advisory; stale data acceptable for 24 hours              |

**Tier definitions**: Critical = automated failover required; High = automated detection, manual failover; Standard = scheduled recovery; Low = best-effort recovery.

## Geographic Redundancy

```
                    ┌─────────────────────────┐
                    │     GLOBAL DNS/CDN       │
                    │   (Cloudflare / AWS)     │
                    └────────┬────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              v              v              v
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   PRIMARY   │ │  SECONDARY  │ │    EDGE     │
    │   Ghana     │ │   Kenya     │ │  Field Sites │
    │             │ │             │ │              │
    │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌──────────┐│
    │ │ K8s     │ │ │ │ K8s     │ │ │ │ Edge     ││
    │ │ Cluster │ │ │ │ Cluster │ │ │ │ Proxy    ││
    │ ├─────────┤ │ │ ├─────────┤ │ │ ├──────────┤│
    │ │ Postgres│ │ │ │ Postgres│ │ │ │ SQLite   ││
    │ │ Primary │─┼─┼─┤ Replica │ │ │ │ Local    ││
    │ ├─────────┤ │ │ ├─────────┤ │ │ ├──────────┤│
    │ │ HSM     │ │ │ │ HSM     │ │ │ │ SoftHSM  ││
    │ │ Active  │ │ │ │ Standby │ │ │ │ Fallback ││
    │ └─────────┘ │ │ └─────────┘ │ │ └──────────┘│
    └─────────────┘ └─────────────┘ └─────────────┘
          │                │               │
          │   Async Repl.  │               │
          ├────────────────┤    Mesh Sync   │
          │                ├───────────────┤
          │                │               │
```

| Path                | Type              | Latency          | Data                                   |
| ------------------- | ----------------- | ---------------- | -------------------------------------- |
| Primary → Secondary | Async replication | <5s              | Full database, key material            |
| Primary → Edge      | Batch sync        | Minutes to hours | Verification data, credential updates  |
| Edge → Edge         | Mesh sync (P2P)   | Seconds (LAN)    | Verification proofs, attestations      |
| Edge → Primary      | Store-and-forward | When connected   | Queued verifications, evidence uploads |

**Data sovereignty**: Each jurisdiction's primary data remains within sovereign infrastructure. Cross-jurisdiction replication transmits only non-sovereign operational data (validator health, system metrics, anonymized analytics).

## Degradation Tiers

| Tier | Color  | Trigger Condition                                          | Available Capability                                                    | Unavailable                                 |
| ---- | ------ | ---------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| 1    | Green  | All systems nominal                                        | Full functionality                                                      | Nothing                                     |
| 2    | Yellow | Non-critical service degraded (Cortex, ANISA)              | Full verification, settlement, identity                                 | Real-time analytics, cultural guidance      |
| 3    | Orange | Critical service degraded (one of: PvP, PANX, or platform) | Core verification (TradePass, GeoTag, GCI, VaultMark)                   | Settlement, new attestations, market access |
| 4    | Red    | Multiple critical failures or primary region loss          | Offline mode: local verification, queued sync                           | All cloud-dependent services                |
| 5    | Black  | Complete infrastructure loss                               | Paper-based fallback with QR-coded evidence for later digital ingestion | All digital services                        |

### Tier Transition Rules

- **Escalation**: Automatic based on health check aggregation. If 2+ Critical-tier services fail simultaneously, escalate directly to Red.
- **De-escalation**: Requires manual confirmation after automated recovery. Operator must verify data consistency before returning to Green.
- **Notification**: Each tier transition triggers alerts to on-call (PagerDuty), jurisdiction operations lead, and system status page.

### Offline Mode (Tier 4) Capabilities

Tier 4 leverages the offline-first architecture that already exists in the protocol layer:

| Protocol  | Offline Capability                                     | Sync Requirement                                  |
| --------- | ------------------------------------------------------ | ------------------------------------------------- |
| TradePass | Issue and verify credentials locally (45-day validity) | Sync new credentials on reconnect                 |
| GeoTag    | Capture and sign location proofs                       | Upload proofs on reconnect                        |
| GCI       | Calculate scores from cached data                      | Refresh signal weights on reconnect               |
| VaultMark | Record custody transfers locally                       | Sync chain on reconnect                           |
| PvP       | Queue settlement requests                              | Execute on reconnect (timeout protection applies) |
| PANX      | Queue attestations                                     | Process backlog on quorum recovery                |

## Operational Resilience

### Chaos Testing Schedule

| Frequency | Test                         | Scope                       | Success Criteria                                                     |
| --------- | ---------------------------- | --------------------------- | -------------------------------------------------------------------- |
| Weekly    | Random pod termination       | Individual K8s pods         | Service recovers within RTO; no data loss                            |
| Monthly   | Network partition simulation | Inter-service communication | Graceful degradation to appropriate tier; no cascading failure       |
| Monthly   | HSM failover drill           | Signing infrastructure      | Standby assumes signing within 5s; no signature failures             |
| Quarterly | Full DR failover             | Primary → Secondary region  | All Critical/High services operational within RTO at secondary site  |
| Quarterly | PANX quorum loss simulation  | Validator infrastructure    | Attestation queue drains within 1 hour of quorum recovery            |
| Annually  | Black tier drill             | Complete infrastructure     | Paper fallback procedures executed; digital recovery within 48 hours |

### SLOs and Alerting

| Service                    | Availability SLO | Latency SLO (p99) | Error Budget (30-day) | Alert Threshold              |
| -------------------------- | ---------------- | ----------------- | --------------------- | ---------------------------- |
| PvP Settlement             | 99.99%           | 2s                | 4.3 min               | 1 min burn in 5 min window   |
| PANX Consensus             | 99.95%           | 5s                | 21.6 min              | 5 min burn in 15 min window  |
| TradePass/GeoTag/VaultMark | 99.9%            | 1s                | 43.2 min              | 10 min burn in 30 min window |
| GCI Scoring                | 99.9%            | 3s                | 43.2 min              | 10 min burn in 30 min window |
| CRX/SGX/AGX Platforms      | 99.9%            | 2s                | 43.2 min              | 10 min burn in 30 min window |
| Cortex Analytics           | 99.5%            | 10s               | 216 min               | 30 min burn in 1 hour window |
| ANISA Guidance             | 99.0%            | 5s                | 432 min               | 1 hour burn in 4 hour window |

**Error budget policy**: When a service exhausts >50% of its 30-day error budget, all deployments to that service freeze until the budget recovers or root cause is addressed.

### Key Recovery

| Aspect             | Detail                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Scheme             | Shamir's Secret Sharing with 3-of-5 threshold                                                                          |
| Share distribution | 5 shares distributed across: CTO, Head of Security, Ghana Operations Lead, Kenya Operations Lead, Legal Counsel        |
| Geographic rule    | No two shares stored in the same physical location                                                                     |
| Storage            | Each share encrypted with the holder's personal key and stored in a tamper-evident envelope in a bank safe deposit box |
| Recovery drill     | Annual drill; 3 holders convene, reconstruct master key, verify all signing operations, re-shard if any holder changes |
| Audit              | Recovery events logged with timestamp, participants, reason, and outcome; retained for 7 years                         |

## Incident Response Integration

This framework integrates with the existing [Incident Response](../operations/runbooks/incident-response.md) procedures:

| Degradation Tier | Incident Severity | Response                                                                               |
| ---------------- | ----------------- | -------------------------------------------------------------------------------------- |
| Yellow           | SEV-3             | On-call acknowledges within 30 min; resolves within 4 hours                            |
| Orange           | SEV-2             | On-call + team lead; war room within 15 min; resolves within 2 hours                   |
| Red              | SEV-1             | All hands; war room within 5 min; executive notification; resolves within 1 hour       |
| Black            | SEV-0             | Crisis management team; government liaison notification; physical deployment if needed |

## Deep Dives

- [Infrastructure Architecture](../architecture/infrastructure-architecture-overview.md) -- Deployment pipeline, environments, and edge architecture
- [Security Policies](../security/security-policy.md) -- Security policy framework and standards
- [Incident Response](../operations/runbooks/incident-response.md) -- Security incident response procedures
- Edge Proxy Overview (`./edge-proxy-overview.md`) -- Edge proxy architecture for field connectivity
- [Data Protection](../compliance/data-classification-policy.md) -- Data protection and encryption standards
