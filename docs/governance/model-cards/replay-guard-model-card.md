---
title: 'Model Card — Replay Guard (Signature Validator)'
status: 'current'
date: '2026-05-27'
model_name: 'gtcx-replay-guard'
model_version: '1.0.0'
owner: 'security-engineering'
tier: 'critical'
tags: ['model-card', 'cryptography', 'security']
review_cycle: 'quarterly'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Model Card — Replay Guard (Signature Validator)

**Model Name:** `gtcx-replay-guard`  
**Version:** 1.0.0  
**Type:** Cryptographic signature verification + nonce replay detection  
**Deployment:** Node.js middleware (Kubernetes Deployment)  
**Last Updated:** 2026-05-12

---

## 1. Model Description

The replay guard validates ECDSA signatures on incoming requests and detects replay attacks via nonce uniqueness checks. It ensures that each mutating request is authentic, fresh, and not previously processed.

**Input:** Request payload + ECDSA signature + nonce + timestamp  
**Output:** Valid/invalid + replay true/false  
**Latency:** < 20ms per verification

---

## 2. Intended Use

| Use Case                     | Supported | Notes                                    |
| ---------------------------- | --------- | ---------------------------------------- |
| Verify ECDSA signatures      | ✅ Yes    | Uses KMS `GetPublicKey` for key material |
| Detect replay attacks        | ✅ Yes    | Nonce deduplication with Redis TTL       |
| Enforce timestamp freshness  | ✅ Yes    | 5-minute window                          |
| Batch signature verification | ❌ No     | Single request only                      |
| Ed25519 signatures           | ❌ No     | ECDSA P-256 only                         |

---

## 3. Model Architecture

```
Request → Extract sig + nonce + timestamp
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Signature Verify    Nonce Check (Redis)
    ↓                   ↓
  Valid?            Unique?
    └─────────┬─────────┘
              ↓
      Freshness Check (±5min)
              ↓
        Pass / Reject
```

**Cryptographic Primitive:** ECDSA with SHA-256 on P-256 curve  
**Key Source:** AWS KMS `alias/gtcx-production-signing`  
**Nonce Store:** Redis with 10-minute TTL

---

## 4. Training Data

**N/A** — Cryptographic verification, not machine learning.

---

## 5. Evaluation

| Metric                | Value  | Benchmark  |
| --------------------- | ------ | ---------- |
| Accuracy              | 1.0000 | ≥ 0.99 ✅  |
| False Acceptance Rate | 0.0000 | ≤ 0.001 ✅ |
| False Rejection Rate  | 0.0000 | ≤ 0.001 ✅ |
| Latency (p99)         | 8ms    | ≤ 20ms ✅  |

**Eval Pipeline:** `tools/eval-pipeline/eval.mjs --model=replay-guard`  
**CI Gate:** Accuracy must be ≥ 0.99  
**Last Evaluation:** 2026-05-12

---

## 6. Limitations

1. **Clock skew sensitivity:** 5-minute window may reject legitimate requests from clients with significant clock drift.
2. **Redis dependency:** Nonce store requires Redis availability; fallback to in-memory cache with reduced TTL.
3. **Single curve support:** Only P-256; no P-384 or P-521 support.
4. **No batching:** Each request verified individually; high-volume scenarios may bottleneck.

---

## 7. Ethical Considerations

| Consideration   | Assessment                                                 |
| --------------- | ---------------------------------------------------------- |
| Privacy impact  | None — operates on cryptographic primitives, no PII access |
| Bias risk       | None — deterministic cryptographic verification            |
| Transparency    | High — algorithm is standard ECDSA verification            |
| Human oversight | Not applicable — fully automated                           |
| Auditability    | Full — every verification logged to CloudTrail             |

---

## 8. Deployment

| Environment | Status | Replicas | Resources        |
| ----------- | ------ | -------- | ---------------- |
| Staging     | Active | 2        | 384Mi / 200m CPU |
| Production  | Active | 3        | 1Gi / 500m CPU   |

**Rollback:** Kubernetes Deployment rollback  
**Monitoring:** `replay-guard-verification-latency` dashboard in Grafana

---

## 9. Changelog

| Version | Date       | Changes                                                 |
| ------- | ---------- | ------------------------------------------------------- |
| 1.0.0   | 2026-05-12 | Initial ECDSA P-256 verification with Redis nonce store |

---

## 10. Contact

- **Model Owner:** Security Engineering (`@security-engineering`)
- **On-Call:** SRE (`@sre-oncall`)
- **Security Questions:** Security Team (`@security`)
