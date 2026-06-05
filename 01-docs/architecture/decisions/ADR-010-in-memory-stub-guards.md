---
title: 'ADR-002: In-Memory Stub Guards'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'standard'
tags: ['compliance', 'architecture', 'infrastructure', 'testing', 'api']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-002: In-Memory Stub Guards

**Status:** Accepted
**Date:** February 2026

---

## Context

All protocol implementations use in-memory stores (Maps, arrays) as default backends for identity stores, audit logs, replay caches, rate limiters, and claim stores. These are intentional for:

1. **Development** — Zero-config local development without external dependencies
2. **Testing** — Fast, isolated test execution without database setup
3. **MVP/demo** — Quick prototyping and proof-of-concept deployments

However, in-memory stores are unsafe for production:

- Data is lost on process restart
- No replication across multiple instances
- Unbounded growth causes OOM crashes

---

## Decision

A two-layer protection system prevents accidental use of stub implementations in production.

### Layer 1: `enforceStubGuard(name, allowInTests?)`

Called at the top of every API handler. When `NODE_ENV=production` and `GTCX_ALLOW_STUBS` is not set, throws `StubNotAllowedError`. This is a hard fail — the process does not start with stubs in production.

### Layer 2: Bounded stores with eviction

All in-memory stores have:

- `maxSize` / `maxEntries` constructor parameters with sensible defaults
- Lazy eviction — expired entries cleaned during normal operations (no background timers)
- Insertion-order eviction when capacity is reached
- JSDoc annotations documenting the recommended production replacement

### Environment Variables

| Variable              | Effect                                                          |
| --------------------- | --------------------------------------------------------------- |
| `NODE_ENV=production` | Blocks all stubs unless `GTCX_ALLOW_STUBS` is set               |
| `NODE_ENV=test`       | Allows stubs by default (overridable with `allowInTests=false`) |
| `GTCX_ALLOW_STUBS=1`  | Permits stubs in non-production environments                    |
| `GTCX_WARN_STUBS=1`   | Logs a warning when a stub is invoked                           |

---

## Consequences

**Positive:**

- Zero-config development experience preserved
- Production deployments fail fast if stubs are accidentally used
- Bounded stores prevent OOM in long-running dev/test processes
- Clear migration path documented via JSDoc on every in-memory implementation

**Negative:**

- Every new API handler must call `enforceStubGuard()` — this is easy to forget
- Developers need to understand the stub guard system when writing integration tests

**Neutral:**

- The `IReplayCache` / `IAsyncReplayCache` interface split allows consumers to choose sync (in-memory) or async (Redis) implementations without changing business logic

---

## Production Migration Path

For each in-memory store, the JSDoc documents the production replacement:

| Stub                  | Production Replacement                      |
| --------------------- | ------------------------------------------- |
| `MemoryIdentityStore` | PostgreSQL-backed `PersistentIdentityStore` |
| `MemoryAuditLog`      | PostgreSQL-backed `PersistentAuditLog`      |
| `MemoryReplayCache`   | `createRedisReplayCache()`                  |
| `MemoryRateLimiter`   | Redis INCR + PEXPIRE                        |

See `../../4-operations/runbooks/production-store-integration.md` for wiring instructions.

---

## Alternatives Considered

- **Fail silently in production** — Unacceptable; data loss is invisible
- **Require production stores from day one** — Kills zero-config development experience
- **Environment-based branching in store code** — Mixes concerns; stub guard pattern is cleaner
