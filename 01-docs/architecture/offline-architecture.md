---
title: 'Offline Architecture'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['architecture', 'infrastructure', 'frontend', 'backend', 'database']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Offline Architecture

**Protocol:** GTCX Protocol Layer
**Version:** 3.0.0

---

## 1. Design Principle

GTCX is **offline-first**. Network connectivity is an enhancement, not a requirement. Every component must function without network access for a minimum of 14 days, with 30 days as the design target.

This is not an edge case — it is the primary operating mode for producers in frontier markets with intermittent connectivity, solar-dependent power, and 2G/3G networks.

---

## 2. Architecture

```
DEVICE (Offline)                              SERVER (Online)
┌───────────────────────┐                     ┌───────────────────────┐
│                       │                     │                       │
│  ┌─────────────────┐  │                     │  ┌─────────────────┐  │
│  │  Local Store    │  │                     │  │  Central DB     │  │
│  │  (SQLite)       │  │                     │  │  (PostgreSQL)   │  │
│  └────────┬────────┘  │                     │  └────────┬────────┘  │
│           │           │                     │           │           │
│           ▼           │                     │           ▲           │
│  ┌─────────────────┐  │    Sync when        │  ┌─────────────────┐  │
│  │  Offline Queue  │  │    connected        │  │   Sync Engine   │  │
│  │  (CRDT-based)   │──┼─────────────────────┼─▶│                 │  │
│  │                 │  │                     │  │  Conflict       │  │
│  │  Max: 10,000    │  │                     │  │  Resolution     │  │
│  │  transactions   │  │                     │  └─────────────────┘  │
│  └────────┬────────┘  │                     │                       │
│           │           │                     │                       │
│           ▼           │                     │                       │
│  ┌─────────────────┐  │                     │                       │
│  │  Evidence Store │  │                     │                       │
│  │  (Photos, GPS)  │  │                     │                       │
│  │  Max: 100MB     │  │                     │                       │
│  └─────────────────┘  │                     │                       │
└───────────────────────┘                     └───────────────────────┘
```

---

## 3. Per-Component Offline Capability

| Component       | Offline Duration | Queue Capacity          | Sync Behavior                                          |
| --------------- | ---------------- | ----------------------- | ------------------------------------------------------ |
| **TradePass™**  | 45 days          | N/A (credential cached) | Full credential refresh on reconnect                   |
| **GeoTag™**     | 30 days          | 1,000 locations         | Batch upload on sync                                   |
| **GCI™**        | 30 days          | Cached score            | Recalculate from queued events on sync                 |
| **VaultMark™**  | 30 days          | 500 transfers           | Ordered replay — causal ordering preserved             |
| **PvP™**        | Queue only       | 100 settlements         | Execute on reconnect; funding requires live connection |
| **VIA™ / VXA™** | 30 days          | 10,000 transactions     | CRDT merge                                             |
| **PANX™**       | N/A              | —                       | Requires 2/3 validators online for consensus           |

---

## 4. CRDT-Based Conflict Resolution

Offline queues use Conflict-free Replicated Data Types (CRDTs). When devices reconnect and sync, conflicts are resolved deterministically — no manual intervention required for the common case.

| Conflict Type                         | Resolution Strategy               | Example                                    |
| ------------------------------------- | --------------------------------- | ------------------------------------------ |
| **Concurrent updates**                | Last-write-wins with vector clock | Two devices update the same record         |
| **Duplicate submissions**             | Idempotency key deduplication     | Same transfer submitted twice              |
| **Out-of-order events**               | Causal ordering                   | Transfer recorded before registration      |
| **Validation failure on sync**        | Flag for manual review            | GCI recalculation produces different score |
| **Concurrent transfer of same asset** | Reject later event                | Two parties claim simultaneous transfer    |
| **Location impossible**               | Reject transfer                   | GPS coordinates inconsistent with timeline |

---

## 5. Sync Protocol

```
Device                                        Server
   │                                             │
   │  1. Connection established                  │
   │────────────────────────────────────────────▶│
   │                                             │
   │  2. Exchange vector clocks                  │
   │◀───────────────────────────────────────────▶│
   │                                             │
   │  3. Device sends delta (changed records)    │
   │────────────────────────────────────────────▶│
   │                                             │
   │               4. Server merges (CRDT rules) │
   │                                             │
   │  5. Server sends delta (new records)        │
   │◀────────────────────────────────────────────│
   │                                             │
   │  6. Device merges                           │
   │                                             │
   │  7. Acknowledge sync complete               │
   │────────────────────────────────────────────▶│
   │                                             │
   │  8. Update vector clocks                    │
   │◀───────────────────────────────────────────▶│
```

---

## 6. Connectivity Profiles

The protocol adapts behavior based on detected network conditions. Six profiles define how content and operations are handled across the connectivity spectrum.

| Profile     | Bandwidth     | Latency   | Characteristics                               |
| ----------- | ------------- | --------- | --------------------------------------------- |
| `offline`   | 0             | N/A       | Queue all writes; reads from local cache      |
| `ussd-only` | 1–10 Kbps     | High      | 140-byte max per exchange; feature phones     |
| `edge`      | 10–200 Kbps   | 500ms+    | Text only; high compression; 10KB max payload |
| `degraded`  | 200Kbps–1Mbps | 200–500ms | Compressed; essential content; 100KB max      |
| `standard`  | 1+ Mbps       | <100ms    | Full capability; real-time                    |
| `satellite` | Variable      | 600ms+    | Batched delivery; cost warnings displayed     |

---

## 7. Storage Limits and Eviction

### Device Budget by Class

| Device Class     | Storage Budget | Capacity                       |
| ---------------- | -------------- | ------------------------------ |
| Entry ($50)      | 50MB           | 30-day queue + evidence        |
| Mid-range ($150) | 200MB          | Extended queue + full evidence |
| Premium ($300+)  | 500MB+         | Full archive                   |

### Eviction Policy

When storage capacity is approached (>90% of budget), the oldest non-critical records are evicted using LRU (Least Recently Used) ordering. Critical records — pending transfers, unsynced custody events, identity credentials — are never evicted automatically.

---

## 8. Offline Queue Duration

The maximum offline queue duration across all components is **30 days**. After 30 days without sync:

1. The device displays a connectivity warning
2. New transactions continue to queue (up to capacity limits)
3. On reconnect, full ordered replay is performed
4. PANX attestation for queued events happens asynchronously post-sync

---

## Reference

- [system-overview.md](system-overview.md)
- [production-store-integration.md](../operations/runbooks/production-store-integration.md)
