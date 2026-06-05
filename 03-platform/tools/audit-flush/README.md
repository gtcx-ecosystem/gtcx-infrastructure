# audit-flush

Sidecar that subscribes to the gateway's signed audit JetStream subject and ships records to the WORM S3 bucket with Object Lock retention.

The sidecar does only three things: consume, verify, write. No business logic, no retry-with-modification, no field rewriting. If the chain doesn't verify, the batch goes to `_quarantine/`, never silently dropped.

## Operational contract

- **Input:** NATS JetStream subject `AUDIT_NATS_SUBJECT` (default `gtcx.audit.>`). Durable consumer named `audit-flush`.
- **Output:** S3 objects under `s3://${AUDIT_S3_BUCKET}/tenant=<tid>/YYYY/MM/DD/HH/<timestamp>-<chainhead>.ndjson` with `ObjectLockMode=COMPLIANCE` and a retention floor of `AUDIT_S3_RETENTION_DAYS` (default 2557 = 7 years).
- **Verification:** Each batch is reconstructed via `@gtcx/audit-signer/chain.fromNdjson` and validated with `verifyChain`. Invalid batches go to `_quarantine/` with a `reason` metadata field.
- **Delivery:** At-least-once. Records carry `id` so downstream readers can dedupe if needed.
- **Probes:** `GET /health` (liveness), `GET /ready` (readiness — requires NATS connected and a successful S3 write in the last 2 minutes).
- **Graceful shutdown:** SIGTERM triggers a final flush + NATS drain before exit.

## Configuration

| Env var                   | Default                                   | Purpose                              |
| ------------------------- | ----------------------------------------- | ------------------------------------ |
| `PORT`                    | `8080`                                    | HTTP port for probes                 |
| `NATS_URL`                | `nats://nats.gtcx.svc.cluster.local:4222` | JetStream broker                     |
| `AUDIT_NATS_SUBJECT`      | `gtcx.audit.>`                            | Subject pattern to consume           |
| `AUDIT_NATS_DURABLE`      | `audit-flush`                             | Durable consumer name                |
| `AUDIT_S3_BUCKET`         | _required_                                | WORM bucket name                     |
| `AUDIT_S3_REGION`         | `af-south-1`                              | Bucket region                        |
| `AUDIT_S3_RETENTION_DAYS` | `2557`                                    | Object Lock retention floor          |
| `AUDIT_FLUSH_BATCH_SIZE`  | `500`                                     | Records per S3 object                |
| `AUDIT_FLUSH_INTERVAL_MS` | `10000`                                   | Max time a record waits before flush |

## Why this is a sidecar, not a gateway feature

The gateway must never block on S3. It signs the record, drops it on JetStream, and continues. The sidecar absorbs the latency, retries, and verification cost, and can be scaled independently. If S3 is unavailable for an hour, the gateway keeps signing, JetStream keeps buffering, and the sidecar catches up — but `/v1/query` latency is unaffected.

## Deployment

See [`01-docs/04-ops/runbooks/audit-flush-deployment.md`](../../01-docs/04-ops/runbooks/audit-flush-deployment.md) for the IRSA role wiring + image build + verification steps.

## Independent verification

A regulator's auditor verifies a flushed bundle with the published `@gtcx/audit-signer` library:

```bash
aws s3 cp s3://gtcx-worm-audit-${ENV}-${REGION}/tenant=${TID}/2026/05/22/13/foo.ndjson /tmp/chain.ndjson
node -e "import('@gtcx/audit-signer').then(m => { \
  const c = m.fromNdjson(require('fs').readFileSync('/tmp/chain.ndjson','utf-8')); \
  console.log(m.verifyChain(c)); \
})"
# expected: { valid: true, firstInvalidIndex: -1, reason: '' }
```

No GTCX-side trust required. The published library + the records' embedded public keys are sufficient.
