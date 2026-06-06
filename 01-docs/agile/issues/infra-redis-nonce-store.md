---
title: 'Redis nonce-store spec for signed-edge envelope validation'
status: 'current'
date: '2026-05-27'
owner: 'platform-engineering'
tier: 'critical'
tags: ['redis', 'nonce', 'replay-protection', 'signed-edge', 'infra']
review_cycle: 'on-change'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Redis Nonce-Store — INFRA Issue

**Blocker for:** gtcx-mobile-prod Ticket 1 (P0)  
**Coordinates with:** #49–54 (staging URL + TLS, audit-bundles verifier, nonce gate, audit/query)

---

## 1. Problem

The signed-edge validator (TradePassAuthGuard) validates `jti` (nonce) against an in-memory audit log. The threat model flags this as:

> "process restart clears cache" — a pod restart allows nonce replay within the 5-min window.

Additionally, the current `NonceGate` is process-scoped. When the compliance-gateway runs >1 replica (staging/production), nonces accepted by pod A are not known to pod B, allowing cross-replica replay.

## 2. Delivered Solution

### 2.1 Redis Deployment

A shared Redis instance has been added to the base Kubernetes manifest:

- **Manifest:** `04-ship/kubernetes/base/services/redis.yaml`
- **Service:** `redis.gtcx.svc.cluster.local:6379`
- **Config:** maxmemory 256mb, allkeys-lru eviction, no persistence
- **Security:** runAsNonRoot, seccomp RuntimeDefault, drop ALL caps

### 2.2 Nonce Store Implementation

**File:** `03-platform/tools/compliance-gateway/src/nonce-store/redis.mjs`

Semantics:

- **Key format:** `nonce:{tenant-id}:{nonce-value}`
- **TTL:** 300s (5-min replay window, matches `NONCE_TTL_MS`)
- **Value:** JSON `{ ts: ISOString, hash: request-hash }` for forensic dup detection
- **Operation:** Redis `SET key value NX EX 300` — atomic check-and-set

Fallback:

- If `REDIS_URL` is unset → in-memory `NonceGate` with WARN log
- If Redis connection fails → in-memory `NonceGate` with WARN log

### 2.3 Wiring

`03-platform/tools/compliance-gateway/src/server.mjs` now initializes the nonce store via:

```js
const auditBundlesNonceGate = createNonceStore({ tenantId: 'audit-bundles' });
```

In the route handler, the store is awaited before use:

```js
nonceGate: await auditBundlesNonceGate,
```

## 3. Deployment Checklist

- [x] Redis manifest created (`04-ship/kubernetes/base/services/redis.yaml`)
- [x] Base kustomization updated to include Redis
- [x] `ioredis` dependency added to compliance-gateway
- [x] `createNonceStore` implementation with Redis + fallback
- [x] `server.mjs` wired to use `createNonceStore`
- [x] Tests for memory fallback path
- [ ] **Deploy Redis:** `kubectl apply -k 04-ship/kubernetes/overlays/staging/`
- [ ] **Set env var:** `REDIS_URL=redis://redis.gtcx-staging.svc.cluster.local:6379`
- [ ] **NetworkPolicy:** verify `redis` port 6379 is reachable from `gtcx-staging` namespace
- [ ] **Integration test:** deploy two gateway replicas, verify cross-replica nonce rejection

## 4. Multi-Service Coordination

The Redis instance is shared. Other services (agx, crx, sgx) can use the same `createNonceStore` pattern with their own `tenantId`:

```js
const nonceStore = await createNonceStore({ tenantId: 'agx' });
```

Each service gets key namespacing (`nonce:agx:{nonce}`) so collisions are impossible.

## 5. Rollback

If Redis causes issues:

1. Unset `REDIS_URL` env var → automatic fallback to in-memory
2. Scale Redis Deployment to 0 → services fall back to in-memory with WARN logs

## 6. Future Work

- **Redis Sentinel / Cluster:** When moving beyond 1 replica, switch to Redis Cluster or Sentinel for HA.
- **Metrics:** Export `nonce_store_hits_total`, `nonce_store_misses_total`, `nonce_store_fallback_active`.
- **Persistence:** Not needed for nonce store (5-min TTL), but may be needed if Redis is reused for other caches.
