---
title: 'ADR-024: Durable Offline Audit Queue'
status: 'proposed'
date: '2026-06-02'
owner: 'platform-engineering'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['architecture', 'audit', 'resilience', 'compliance', 'global-south']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-06-02/m2-hardening'
trust_score: 70
autonomy_level: 'permissioned'
---

# ADR-024: Durable Offline Audit Queue

## Status

Proposed

## Date

2026-06-02

## Context

The compliance-gateway emits one signed audit record per consequential decision. ADR-014 selected NATS JetStream as the transport, with an audit-flush sidecar consuming to WORM S3. The current `audit-sink.mjs` falls back to stdout when NATS is unreachable, but stdout is ephemeral: if the audit-flush sidecar is not yet running, or if the node is under disk pressure and log rotation drops lines, audit records are lost.

The 10/10 roadmap flags this as a **cap risk**: Global South Resilience is at risk of a 4.5 ceiling because the current "queue" is a boolean flag (`isDelayedOfflineReplay` derived from `clockSkewMs > 300000`), not a durable structure. DFI technical reviewers explicitly prioritize resilience over compliance certifications. M2 is blocked on proving that audit records survive process restart, crash recovery, and extended NATS outage.

Requirements:

1. **Durability across process restart** — records written before SIGKILL must be available after restart
2. **Crash safety** — records must hit disk before `emit()` returns (fsync)
3. **Ordering** — records drain in insertion order (per-tenant ordering is preserved by NATS subject)
4. **No external dependency** — queue must work when NATS, Redis, and PostgreSQL are all down
5. **Bounded growth** — queue must not exhaust disk; configurable max size with telemetry
6. **Fail-soft** — if the queue itself errors, fall back to stdout so signing is never blocked
7. **Zero native dependencies** — must build on `node:20-alpine` without `python`, `make`, or `g++`

## Decision

We use an **append-only JSONL file with byte-offset cursor** as the offline audit queue.

### Design

```
$AUDIT_QUEUE_DIR/
  records.jsonl   # Append-only; each line is a JSON audit record
  cursor          # Single integer: byte offset of next record to drain
```

**Write path (`emit`):**

1. Serialize record to JSON + newline
2. `fs.appendFileSync` to `records.jsonl`
3. `fs.fsyncSync` on the file descriptor
4. Return immediately (latency < 1ms on SSD)

**Read path (background drain):**

1. Read `cursor` file → byte offset `N`
2. `fs.createReadStream({ start: N })` on `records.jsonl`
3. Parse lines with `readline` interface
4. For each record: attempt NATS publish
5. On successful publish: `fs.writeFileSync(cursor, String(newOffset))`
6. On publish failure: stop draining, retry after `AUDIT_QUEUE_DRAIN_INTERVAL_MS` (default 5000ms)
7. When `cursor` == `records.jsonl` size: queue is empty; truncate `records.jsonl` and reset `cursor` to 0

**Startup:**

1. On `getSink()` initialization, start background drain interval
2. If `cursor` < file size, drain begins immediately

**Rotation / compaction:**

- When queue is fully drained, atomically rename `records.jsonl` to `records.jsonl.compact`, create empty `records.jsonl`, then remove `.compact`
- This prevents the file from growing unbounded across normal operation

**Bounds:**

- `AUDIT_QUEUE_MAX_BYTES` (default 100 MiB)
- If queue exceeds max size, new records still append (never drop), but telemetry emits `audit.queue.oversized` warning
- Operator alert triggers on `audit.queue.oversized` to provision more disk or investigate network partition

## Alternatives Considered

| Option                          | Pros                                                                                    | Cons                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Append-only JSONL + cursor**  | Zero deps; fsync per write; trivial to debug; works on any filesystem; cursor is atomic | No built-in indexing; compaction is manual; not a database                                                           |
| SQLite (`node:sqlite` Node 22+) | ACID transactions; structured queries; WAL mode is durable                              | Requires Node 22+; not available in `node:20-alpine`; adds complexity we don't need (no queries, just append + scan) |
| `better-sqlite3`                | Same as above; works on Node 20                                                         | Native module requires `python`, `make`, `g++` — violates zero-native-dep constraint for Alpine containers           |
| Redis Streams                   | Already in stack; pub/sub semantics                                                     | Requires Redis to be up — fails requirement #4 (no external dependency when everything is down)                      |
| NATS JetStream work queue       | Same broker as primary transport                                                        | Requires NATS to be up — fails requirement #4                                                                        |
| LevelDB / RocksDB               | Fast; compaction built-in                                                               | Native bindings; complex build; overkill for append-only log                                                         |

## Consequences

**Positive:**

- Audit records survive process restart, SIGKILL, and container eviction
- No new external dependency; queue works in air-gapped or partitioned environments
- Sub-millisecond write latency; does not block the signing hot path
- File format is human-readable JSONL — operators can `tail` or `jq` the queue for debugging
- Cursor is a single integer; recovery after crash is deterministic

**Negative:**

- Compaction is cooperative (happens only on full drain); under sustained outage the file grows until disk is full
- No built-in encryption at rest; relies on filesystem encryption (FDE) or encrypted volume
- Concurrent writers (multiple gateway pods on same node sharing `hostPath`) require file locking; we avoid this by using `emptyDir` per pod

**Neutral:**

- Queue format is independent of transport; swapping NATS for Kafka later does not change queue semantics
- The same queue module can be reused for other offline-capable sinks (e.g., metrics, telemetry)

## Interface

```javascript
// 03-platform/tools/compliance-gateway/03-platform/src/disk-queue.mjs
export function createDiskQueue(options);
// Returns: { enqueue(record), startDrain(sink), stopDrain(), getStats() }
```

```javascript
// Integration in audit-sink.mjs
const queue = createDiskQueue({
  dir: process.env.AUDIT_QUEUE_DIR || '/tmp/gtcx-audit-queue',
  maxBytes: parseInt(process.env.AUDIT_QUEUE_MAX_BYTES || '104857600', 10),
  drainIntervalMs: parseInt(process.env.AUDIT_QUEUE_DRAIN_INTERVAL_MS || '5000', 10),
});
queue.startDrain(natsSink);
```

## References

- ADR-014 — NATS JetStream as the Audit Record Transport
- ADR-016 — Fail-closed audit signing in production
- `03-platform/tools/compliance-gateway/03-platform/src/audit-sink.mjs` — current sink implementation
- `03-platform/tools/chaos-tests/offline-queue-restart.test.mjs` — M2 acceptance test (to be created)
- 10/10 roadmap — Global South Resilience cap risk (M2)
