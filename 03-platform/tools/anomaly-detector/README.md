# Anomaly Detector — GTCX Compliance Gateway

Real-time anomaly detection for GTCX infrastructure metrics. Integrates with the
SIGNAL scorecard S3 control (real-time anomaly detection).

## Usage

```bash
# Run against live Prometheus metrics
node 03-platform/tools/anomaly-detector/detector.mjs --threshold=10 --window=300000

# Dry-run mode (logs only, no alerts)
node 03-platform/tools/anomaly-detector/detector.mjs --dry-run

# Run against synthetic data (for CI/testing)
node 03-platform/tools/anomaly-detector/detector.mjs \
  --synthetic-data=03-platform/tools/anomaly-detector/test-fixtures/synthetic-metrics.json
```

## Detection Rules

| Rule                             | Severity | Trigger                                         |
| -------------------------------- | -------- | ----------------------------------------------- |
| `query_rate_spike`               | high     | Query rate > threshold × baseline (default 10×) |
| `mutating_tool_without_approval` | critical | Any mutating tool call without approval ticket  |
| `replay_rejection_rate`          | critical | Replay nonce rejection rate > 5%                |
| `unknown_did_frequency`          | warning  | Unknown DID frequency > 3 per minute            |
| `off_hours_admin_access`         | warning  | Admin access outside 06:00–22:00 CAT            |

## CI Integration

```bash
# Validate all 5 rules against synthetic data
node --test 03-platform/tools/anomaly-detector/tests/detector.test.mjs
```

The test suite validates:

- Each rule fires correctly on anomalous data
- Healthy data produces zero anomalies
- Dry-run mode exits 0 even with anomalies
- All 5 rules are evaluated on every run

## Architecture

```
Prometheus counters → rule engine (5 rules) → alert routing → PagerDuty/Slack
                    ↑
            synthetic data mode (CI)
```

## Exit Codes

| Code | Meaning                                |
| ---- | -------------------------------------- |
| 0    | No anomalies detected (or dry-run)     |
| 1    | One or more anomalies detected         |
| 1    | Prometheus unreachable or invalid data |
