---
title: 'Model Card — Anomaly Detector'
status: 'current'
date: '2026-05-27'
model_name: 'gtcx-anomaly-detector'
model_version: '1.0.0'
owner: 'ml-engineering'
tier: 'critical'
tags: ['model-card', 'anomaly-detection', 'ml']
review_cycle: 'quarterly'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Model Card — Anomaly Detector

**Model Name:** `gtcx-anomaly-detector`  
**Version:** 1.0.0  
**Type:** Rule-based statistical anomaly detection  
**Deployment:** Kubernetes CronJob (staging + production)  
**Last Updated:** 2026-05-12

---

## 1. Model Description

The anomaly detector evaluates Prometheus metrics against configurable thresholds to identify unusual patterns in the GTCX compliance gateway. It operates as a batch processor (CronJob) polling metrics every 5 minutes (production) or 2 minutes (staging).

**Input:** Time-series metrics from Prometheus  
**Output:** Anomaly alerts with severity (low / high / critical)  
**Latency:** < 5 seconds per evaluation batch

---

## 2. Intended Use

| Use Case                              | Supported  | Notes                                    |
| ------------------------------------- | ---------- | ---------------------------------------- |
| Detect query rate spikes              | ✅ Yes     | Threshold-based on baseline × multiplier |
| Detect mutating tool without approval | ✅ Yes     | Critical severity                        |
| Detect error rate anomalies           | ✅ Yes     | Configurable threshold                   |
| Predict future failures               | ❌ No      | Not a predictive model                   |
| Replace human monitoring              | ⚠️ Partial | Augments; does not replace 24/7 SOC      |

---

## 3. Model Architecture

```
Prometheus Metrics → Rule Engine → Severity Classification → Alert (SNS/Slack)
                          ↑
                    Configurable Thresholds
```

**Rules:**

| Rule ID | Name                      | Selector             | Threshold     | Severity |
| ------- | ------------------------- | -------------------- | ------------- | -------- |
| R001    | query_rate_spike          | `!mutating && !code` | baseline × 10 | high     |
| R002    | mutating_without_approval | `mutating == true`   | > 0           | critical |
| R003    | error_rate_spike          | `code >= 500`        | > 5%          | high     |

---

## 4. Training Data

**N/A** — This is a rule-based system, not a machine learning model. Thresholds are configured by operators based on historical baseline analysis.

**Baseline Calculation:**

- Window: 24-hour rolling average
- Update frequency: Daily at 00:00 UTC
- Source: Prometheus `rate()` queries

---

## 5. Evaluation

| Metric              | Value  | Benchmark |
| ------------------- | ------ | --------- |
| Precision           | 1.0000 | ≥ 0.95 ✅ |
| Recall              | 1.0000 | ≥ 0.95 ✅ |
| F1 Score            | 1.0000 | ≥ 0.95 ✅ |
| False Positive Rate | 0.0000 | ≤ 0.05 ✅ |
| Latency (p99)       | 2.3s   | ≤ 5s ✅   |

**Eval Pipeline:** `tools/eval-pipeline/eval.mjs --model=anomaly-detector`  
**CI Gate:** F1 score must be ≥ 0.95  
**Last Evaluation:** 2026-05-12

---

## 6. Limitations

1. **Threshold sensitivity:** Static thresholds may miss gradual drift (requires periodic recalibration).
2. **No causal analysis:** Detects anomalies but does not identify root causes.
3. **Single-metric focus:** Does not correlate across multiple metrics simultaneously.
4. **Batch latency:** 5-minute polling window means anomalies may not be detected for up to 5 minutes.

---

## 7. Ethical Considerations

| Consideration   | Assessment                                             |
| --------------- | ------------------------------------------------------ |
| Privacy impact  | None — operates on aggregated metrics, no PII          |
| Bias risk       | Low — rule-based, thresholds are transparent           |
| Transparency    | High — all rules documented, thresholds configurable   |
| Human oversight | Required — alerts route to on-call engineer            |
| Auditability    | Full — every evaluation logged to CloudTrail + WORM S3 |

---

## 8. Deployment

| Environment | Status | Schedule    | Resources      |
| ----------- | ------ | ----------- | -------------- |
| Staging     | Active | Every 2 min | 32Mi / 25m CPU |
| Production  | Active | Every 5 min | 64Mi / 50m CPU |

**Rollback:** Delete CronJob or set `suspend: true`  
**Monitoring:** CloudWatch alarm `anomaly-detector-failures`

---

## 9. Changelog

| Version | Date       | Changes                      |
| ------- | ---------- | ---------------------------- |
| 1.0.0   | 2026-05-12 | Initial release with 3 rules |

---

## 10. Contact

- **Model Owner:** ML Engineering (`@ml-engineering`)
- **On-Call:** SRE (`@sre-oncall`)
- **Security Questions:** Security Team (`@security`)
