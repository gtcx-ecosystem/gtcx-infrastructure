# @gtcx/kyc-screening

Ambient KYC screening worker — triggered on S3 `ObjectCreated` events, writes screening results for operator review on next session.

## Behavior

- Fails closed without `SCREENING_LOCAL_SALT` outside tests
- Rejects S3 keys with control characters before screening
- Idempotent: skips re-screen when a result object already exists

## Commands

```bash
pnpm --filter @gtcx/kyc-screening test
pnpm --filter @gtcx/kyc-screening package   # Lambda zip via package-lambda.sh
```

**Policy:** [`01-docs/10-compliance/aml-monitoring-policy.md`](../../01-docs/10-compliance/aml-monitoring-policy.md)
