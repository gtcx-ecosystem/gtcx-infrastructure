---
title: 'Outbound — INT-S9-01 staging smoke unblocked'
status: sent
date: 2026-06-04
owner: gtcx-infrastructure
target: gtcx-intelligence
---

# Outbound: INT-S9-01 staging smoke unblocked

## What was blocked

`api.staging.gtcx.trade/v1/evidence/submit` returned 403 via ALB despite pod returning 201 on port-forward.

## Root cause

AWS WAF `gtcx-staging-waf-af-south-1` rule `AllowAuditAndTradePassEndpoints` only allowed `/audit` and `/v1/tradepass`. `/v1/evidence/submit` fell through to managed rules and was blocked.

## Fix applied

Added `/v1/evidence/submit` to `AllowAuditAndTradePassEndpoints` WAF rule (ByteMatchStatement, STARTS_WITH, LOWERCASE).

## Verification

```bash
curl -X POST -H "Authorization: Bearer $GTCX_API_KEY" \
  -d '{"signalId":"int-s9-01-smoke",...}' \
  https://api.staging.gtcx.trade/v1/evidence/submit
# → 200 {"evidenceId":"88ae9690-bffb-42f0-a68e-83ac6c2e4729","status":"submitted",...}
```

## Next step

Run `int-s9-01-staging-smoke-acceptance.md` in gtcx-intelligence.
