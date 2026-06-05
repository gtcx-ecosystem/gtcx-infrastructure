# Eval Pipeline — Model Migration Guide

**Version:** 1.1.0  
**Owner:** Platform AI Safety Team  
**Review Cycle:** Per model release

---

## Overview

This guide defines the migration path for deploying new or updated AI models to production. Every model must pass the eval pipeline before it can be promoted from `staging` to `production`.

---

## Migration Stages

### Stage 1: Benchmark Development

**Owner:** ML Engineer + Domain Expert

1. Define ground-truth benchmark with ≥100 cases covering:
   - Normal operations (70% of cases)
   - Edge cases (20% of cases)
   - Adversarial / failure-mode cases (10% of cases)
2. Benchmark must be versioned (`benchmarks/<model>-v<N>.json`)
3. Benchmark requires peer review before use

### Stage 2: Local Evaluation

**Owner:** ML Engineer

```bash
cd 03-platform/tools/eval-pipeline
node eval.mjs --model=<model-name>
```

**Pass criteria:**

- Accuracy/F1 ≥ model-specific threshold
- `avg_confidence` ≥ 0.70
- No errors in benchmark loading

### Stage 3: CI Validation

**Owner:** Platform Engineering

The eval pipeline runs automatically in CI on every PR that touches:

- `03-platform/tools/eval-pipeline/eval.mjs`
- `03-platform/tools/eval-pipeline/benchmarks/*.json`
- Model implementation files

**CI gate:** Exit 0 only if all models pass threshold AND confidence ≥ 0.70.

### Stage 4: Staging Deployment

**Owner:** DevOps

1. Deploy model to staging environment
2. Run synthetic data through model for 24 hours
3. Collect metrics: latency, error rate, confidence distribution
4. Anomaly detector must not flag model behavior as anomalous

### Stage 5: Production Promotion

**Owner:** CISO + Engineering Lead (dual approval)

Required evidence:

- [ ] Eval pipeline CI gate passed (artifact link)
- [ ] Benchmark version and case count documented
- [ ] Staging synthetic run completed (24h metrics)
- [ ] Model card updated (`01-docs/ml/model-cards/`)
- [ ] Rollback procedure documented
- [ ] Break-glass procedure tested

---

## Rollback Criteria

Promote model back to staging (or previous version) if ANY of the following occur within 72 hours of production deployment:

1. Accuracy drops >5% from benchmark score
2. Average confidence drops below 0.60
3. Anomaly detector flags ≥3 critical anomalies related to model
4. Error rate >0.1% on model endpoints
5. PagerDuty incident triggered by model behavior

---

## Version History

| Version | Date       | Change                                             | Migration Required?   |
| ------- | ---------- | -------------------------------------------------- | --------------------- |
| 1.0.0   | 2026-05-08 | Initial pipeline (accuracy/F1 thresholds only)     | —                     |
| 1.1.0   | 2026-05-17 | Added confidence scoring + confidence gate (≥0.70) | Re-run all benchmarks |

---

## References

- Model cards: `01-docs/ml/model-cards/`
- Benchmarks: `03-platform/tools/eval-pipeline/benchmarks/`
- CI gate: `.github/workflows/eval-pipeline.yml`
- Anomaly detector: `03-platform/tools/anomaly-detector/detector.mjs`
- Break-glass: `01-docs/09-security/break-glass-procedure.md`
