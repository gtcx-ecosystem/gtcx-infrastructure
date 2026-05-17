---
title: 'Model Card — Deployment Guard'
status: 'current'
date: '2026-05-17'
model_name: 'gtcx-deployment-guard'
model_version: '1.0.0'
owner: 'platform-engineering'
tier: 'critical'
tags: ['model-card', 'deployment', 'canary', 'ml']
review_cycle: 'quarterly'
---

# Model Card — Deployment Guard

**Model Name:** `gtcx-deployment-guard`
**Version:** 1.0.0
**Type:** Rule-based canary evaluation gate
**Deployment:** Kubernetes Admission Webhook (staging + production)
**Last Updated:** 2026-05-17

---

## 1. Model Description

The deployment guard evaluates canary rollout health against SLO thresholds before promoting a new version to full traffic. It acts as an automated gate in the CD pipeline, preventing bad deployments from reaching production.

**Input:** Prometheus metrics for canary pod (error rate, latency p99, throughput)
**Output:** Promote / Hold / Rollback decision with confidence score
**Latency:** < 10 seconds per evaluation

---

## 2. Intended Use

| Use Case                        | Supported  | Notes                                                   |
| ------------------------------- | ---------- | ------------------------------------------------------- |
| Canary health gating            | ✅ Yes     | Automated promote/hold/rollback                         |
| SLO-based deployment validation | ✅ Yes     | p99 latency, error rate, throughput                     |
| A/B test winner selection       | ❌ No      | Not a statistical test framework                        |
| Replace human release approval  | ⚠️ Partial | Augments; critical changes still require human sign-off |

---

## 3. Model Architecture

```
Canary Metrics → SLO Rule Engine → Decision (Promote / Hold / Rollback)
                      ↑
                Configurable Thresholds
```

**Rules:**

| Rule ID | Name             | Selector                      | Threshold      | Action   |
| ------- | ---------------- | ----------------------------- | -------------- | -------- |
| D001    | error_rate_gate  | `rate(errors[5m])`            | < 1%           | Promote  |
| D002    | latency_p99_gate | `histogram_quantile(0.99, …)` | < 500ms        | Promote  |
| D003    | throughput_gate  | `rate(requests[5m])`          | ≥ 90% baseline | Promote  |
| D004    | rollback_trigger | Any of D001–D003 failing      | —              | Rollback |

---

## 4. Training Data

**N/A** — This is a rule-based system. Thresholds are derived from production SLO baselines and adjusted quarterly.

---

## 5. Evaluation

| Metric              | Value | Benchmark |
| ------------------- | ----- | --------- |
| False Promote Rate  | 0.00  | ≤ 0.01 ✅ |
| False Rollback Rate | 0.03  | ≤ 0.05 ✅ |
| Decision Latency    | 4.2s  | ≤ 10s ✅  |

---

## 6. Limitations

- Requires Prometheus metrics to be available for canary pods
- Does not evaluate business-logic correctness, only operational health
- Single-region evaluation; multi-region canaries require sequential gating

---

## 7. Ethical Considerations

| Concern            | Assessment | Mitigation                                 |
| ------------------ | ---------- | ------------------------------------------ |
| Automated rollback | Low risk   | Human can override; audit log captures all |
| Deployment bias    | Low risk   | Same rules applied to all services         |

---

## 8. Deployment

| Environment | Status | Schedule     | Resources          |
| ----------- | ------ | ------------ | ------------------ |
| Staging     | Active | Every deploy | 1 webhook pod      |
| Production  | Active | Every deploy | 2 webhook pods, HA |

---

## 9. Changelog

| Date       | Change             | Author                  |
| ---------- | ------------------ | ----------------------- |
| 2026-05-17 | Initial model card | frontier-infra-engineer |

---

## 10. Contact

- **Owner:** Platform Engineering
- **Escalation:** `#incidents` Slack channel
