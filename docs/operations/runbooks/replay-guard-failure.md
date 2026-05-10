# Runbook: Replay Guard Failure

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

|                |                                                 |
| -------------- | ----------------------------------------------- |
| **Service**    | `gtcx-replay-guard`                             |
| **Severity**   | P1 (blocks mobile offline queue replay)         |
| **Owner**      | Platform SRE                                    |
| **Principles** | SECURE (P11), RESILIENT (P12), OBSERVABLE (P15) |

---

## Symptoms

- Mobile app users report "Request rejected" or 401 errors on replayed offline operations
- `replay_protection_total{code="REPLAY_OK"}` drops to zero
- `gtcx-replay-guard` pods show `CrashLoopBackOff` or `ImagePullBackOff`
- Redis connection errors in replay-guard logs
- HPA unable to scale (max replicas reached)

---

## Detection

```promql
# Replay guard is down — no successful verifications in 2 min
sum(rate(replay_protection_total[2m])) == 0

# Redis nonce store unreachable (fallen back to memory)
replay_guard_redis_connected == 0

# High rejection rate (possible clock skew spike)
sum(rate(replay_protection_total{code=~"REPLAY_FUTURE|REPLAY_STALE"}[5m]))
  / sum(rate(replay_protection_total[5m])) > 0.5

# Replay attack indicator — nonce rejections spiking
sum(rate(replay_protection_total{code="REPLAY_NONCE"}[5m])) > 30

# Delayed offline replay events
sum(rate(replay_protection_total{code="REPLAY_OK"}[15m])) by (region)
  * on() group_left() (replay_protection_clock_skew_ms_bucket{le="+Inf"} > 300000)
```

---

## Immediate Response (< 5 min)

### 1. Check replay-guard health

```bash
kubectl get pods -n gtcx -l app=gtcx-replay-guard
kubectl logs -n gtcx -l app=gtcx-replay-guard --tail=100
```

### 2. Check Redis connectivity

```bash
kubectl exec -it deploy/gtcx-replay-guard -n gtcx -- \
  node -e "require('redis').createClient({url:process.env.REDIS_URL}).connect().then(()=>console.log('OK')).catch(e=>console.error(e.message))"
```

If Redis is down:

- Replay-guard **falls back to in-memory store** automatically
- **Risk:** nonce replay protection is weakened across pod restarts
- **Mitigation:** Restart Redis or scale the Redis StatefulSet

### 3. Check HPA status

```bash
kubectl get hpa gtcx-replay-guard -n gtcx
kubectl top pods -n gtcx -l app=gtcx-replay-guard
```

If CPU/memory is saturated:

- HPA should auto-scale to max 10 replicas
- If max reached, increase `maxReplicas` temporarily:
  ```bash
  kubectl patch hpa gtcx-replay-guard -n gtcx \
    --type='merge' -p '{"spec":{"maxReplicas":20}}'
  ```

---

## Root Cause Analysis

| Scenario                        | Logs                                              | Fix                                                                        |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| Redis connection timeout        | `Redis unavailable, falling back to memory store` | Restart Redis; check network policies                                      |
| Clock skew spike (global-south) | `REPLAY_FUTURE` rate > 50%                        | Extend `LOW_CONN_BUFFER_MS` temporarily; investigate NTP on mobile devices |
| Signature verification failure  | `REPLAY_SIGNATURE` rate spike                     | Check DID resolver health; verify key rotation schedule                    |
| Envelope/hash mismatch          | `REPLAY_ENVELOPE` rate spike                      | Verify mobile serialization contract alignment; check for MITM             |
| Nonce store overflow (memory)   | `MemoryNonceStore maxSize reached`                | Switch to Redis; increase `maxSize`                                        |
| OTLP push failure               | `ETIMEDOUT` to collector                          | Non-critical; metrics buffered in memory                                   |

---

## Recovery

### Scale replay-guard manually if HPA is stuck

```bash
kubectl scale deployment gtcx-replay-guard -n gtcx --replicas=5
```

### Restart all replay-guard pods (graceful)

```bash
kubectl rollout restart deployment/gtcx-replay-guard -n gtcx
kubectl rollout status deployment/gtcx-replay-guard -n gtcx --timeout=120s
```

### Validate recovery

```bash
# Should return 200 with allowed: true
curl -s http://gtcx-replay-guard.gtcx:8400/v1/replay/verify \
  -H "Content-Type: application/json" \
  -d '{
    "integrity": {
      "scheme": "did-jwt-es256",
      "did": "did:gtcx:device:smoke-test",
      "keyId": "key-1",
      "audience": "gtcx-api",
      "bodyHash": "'$(echo -n "{}" | sha256sum | cut -d" " -f1)'",
      "headersHash": "'$(echo -n "{}" | sha256sum | cut -d" " -f1)'",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "nonce": "smoke-'$(date +%s)'",
      "signature": "c2ln",
      "envelopeHash": "'$(echo -n "test" | sha256sum | cut -d" " -f1)'"
    }
  }' | jq .
```

---

## Post-Incident

1. Capture metrics snapshot:
   ```bash
   curl -s http://gtcx-replay-guard.gtcx:8400/metrics
   ```
2. Save logs:
   ```bash
   kubectl logs -n gtcx -l app=gtcx-replay-guard --since=1h > /tmp/replay-guard-logs-$(date +%s).txt
   ```
3. Open incident ticket with `gtcx/incident-response` template
4. Schedule chaos re-run to validate fix:
   ```bash
   kubectl apply -f infra/kubernetes/overlays/production/chaos/replay-guard-pod-kill.yaml
   ```

## Fail-Safe Nonce Semantics

The replay-guard uses **fail-safe nonce semantics**: once a nonce is consumed, it stays consumed regardless of downstream verification outcome. This means:

- A request with a valid nonce but invalid signature will have its nonce permanently consumed
- Legitimate clients must generate a **fresh nonce** for every request (including retries)
- Attackers cannot replay rejected requests to probe the system

If you see `REPLAY_NONCE` rejections from legitimate clients, check:

1. Client is generating unique nonces (not reusing)
2. Client clock is within acceptable skew
3. Client is computing envelope hashes correctly
