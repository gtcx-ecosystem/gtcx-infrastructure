# GTCX Eval Pipeline

AI output evaluation pipeline for the GTCX infrastructure platform.

## Usage

```bash
# Evaluate a single model
node eval.mjs --model=anomaly-detector

# Evaluate all registered models (CI gate)
node eval.mjs --all
```

## Adding a Model

1. Add threshold to `THRESHOLDS` in `eval.mjs`
2. Create benchmark JSON in `benchmarks/<model>.json`
3. Implement evaluator function in `eval.mjs`
4. Add model card to `01-docs/ml/model-cards/<model>-model-card.md`

## CI Integration

The eval pipeline runs as a required job in `ci.yml`. It exits non-zero if any model falls below its threshold, blocking merge.
