# Anomaly Detector — PoC

Lightweight anomaly detection for GTCX compliance gateway metrics.

## Usage

```bash
# Run against live Prometheus metrics
node tools/anomaly-detector/detector.mjs --threshold=10 --window=300000

# Dry-run mode (logs only, no alerts)
node tools/anomaly-detector/detector.mjs --dry-run
```

## Detection Rules

| Rule                           | Threshold               | Window  |
| ------------------------------ | ----------------------- | ------- |
| Query rate spike               | >10× baseline           | 5 min   |
| Mutating tool without approval | any                     | instant |
| Replay rejection rate          | >5%                     | 1 min   |
| Unknown DID frequency          | >3/min                  | 1 min   |
| Off-hours admin access         | outside 06:00–22:00 CAT | instant |

## Architecture

Prometheus counters → sliding window → threshold comparison → PagerDuty webhook
