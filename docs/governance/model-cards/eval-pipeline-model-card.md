---
title: 'Model Card — Eval Pipeline'
status: 'current'
date: '2026-05-27'
model_name: 'gtcx-eval-pipeline'
model_version: '1.0.0'
owner: 'ml-engineering'
tier: 'critical'
tags: ['model-card', 'eval', 'benchmark', 'ml']
review_cycle: 'quarterly'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Model Card — Eval Pipeline

**Model Name:** `gtcx-eval-pipeline`
**Version:** 1.0.0
**Type:** CI evaluation framework for AI service outputs
**Deployment:** GitHub Actions (`ci.yml` + `eval-pipeline.yml`)
**Last Updated:** 2026-05-17

---

## 1. Model Description

The eval pipeline is a continuous validation framework that runs benchmark suites against GTCX AI services to detect regression before code reaches production. It acts as a required CI gate, failing the build if any model falls below its threshold.

**Input:** Benchmark JSON files with ground-truth expected outputs
**Output:** Pass/fail scorecard per model with precision, recall, F1, accuracy
**Latency:** < 30 seconds for all models

---

## 2. Intended Use

| Use Case                   | Supported | Notes                                  |
| -------------------------- | --------- | -------------------------------------- |
| Regression detection in CI | ✅ Yes    | Runs on every PR and push to main      |
| Model performance tracking | ✅ Yes    | Artifacts retained 90 days             |
| Hyperparameter tuning      | ❌ No     | Not a training framework               |
| Production inference       | ❌ No     | Evaluation only; no runtime dependency |

---

## 3. Model Architecture

```
Benchmark JSON → Evaluator Function → Scorecard → Threshold Gate → CI Pass/Fail
                      ↑
              Per-Model Thresholds
```

**Registered Models:**

| Model              | Metric   | Threshold | Benchmark File                       |
| ------------------ | -------- | --------- | ------------------------------------ |
| anomaly-detector   | F1       | ≥ 0.95    | `benchmarks/anomaly-detector.json`   |
| compliance-gateway | Accuracy | ≥ 0.90    | `benchmarks/compliance-gateway.json` |
| replay-guard       | Accuracy | ≥ 0.99    | `benchmarks/replay-guard.json`       |

---

## 4. Training Data

**N/A** — This is an evaluation framework, not a trained model. Benchmarks are curated by domain experts and versioned with the code.

---

## 5. Evaluation

| Metric             | Value | Benchmark |
| ------------------ | ----- | --------- |
| Framework Uptime   | 100%  | ≥ 99% ✅  |
| Eval Latency (all) | 12s   | ≤ 30s ✅  |
| False Pass Rate    | 0.00  | ≤ 0.01 ✅ |

---

## 6. Limitations

- Benchmarks are static; adversarial or dynamic evaluation requires manual update
- Does not cover latency/throughput regression (separate load-test gate)
- Thresholds are global; per-environment overrides not yet supported

---

## 7. Ethical Considerations

| Concern          | Assessment | Mitigation                                 |
| ---------------- | ---------- | ------------------------------------------ |
| Benchmark bias   | Low risk   | Ground truth reviewed by domain experts    |
| Threshold gaming | Low risk   | Threshold changes require PR + code review |

---

## 8. Deployment

| Environment | Status | Schedule | Resources             |
| ----------- | ------ | -------- | --------------------- |
| CI          | Active | Every PR | GitHub Actions runner |

---

## 9. Changelog

| Date       | Change                                  | Author                  |
| ---------- | --------------------------------------- | ----------------------- |
| 2026-05-17 | Wired into `ci.yml` as required CI gate | frontier-infra-engineer |
| 2026-05-17 | Initial model card                      | frontier-infra-engineer |

---

## 10. Contact

- **Owner:** ML Engineering
- **Escalation:** `#incidents` Slack channel
