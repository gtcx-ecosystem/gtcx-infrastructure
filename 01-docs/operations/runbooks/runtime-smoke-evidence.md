---
title: 'Runtime Smoke Evidence'
status: 'current'
date: '2026-05-27'
owner: 'sre'
role: 'sre'
tier: 'critical'
tags: ['runtime', 'smoke', 'evidence', 'audit']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Runtime Smoke Evidence

Use this command to capture standalone runtime evidence for `/health`, `/metrics`, or an authenticated equivalent.

## Public Mode

```bash
pnpm ctl evidence runtime-smoke \
  --environment=staging \
  --base-url=https://api.staging.gtcx.trade
```

## Bearer Mode

```bash
GTCX_SMOKE_BEARER_TOKEN='...' \
pnpm ctl evidence runtime-smoke \
  --environment=staging \
  --base-url=https://api.staging.gtcx.trade \
  --mode=bearer \
  --bearer-token-env=GTCX_SMOKE_BEARER_TOKEN \
  --endpoint=health=/health \
  --endpoint=metrics=/metrics \
  --strict
```

Bearer tokens are read from the named environment variable and are redacted in evidence output.

## Output

Default output path:

```text
04-ship/security/reports/runtime-smoke-evidence/<environment>/<utc-timestamp>/
```

Files:

- `runtime-smoke-evidence.json`
- `summary.md`
- `response-<endpoint>.txt`

## Audit Use

Attach the generated directory to release evidence or WORM evidence. A protected endpoint that returns `403` in public mode is still useful evidence, but it does not close the authenticated runtime smoke gap. To close that gap, run bearer mode with a scoped smoke credential and `--strict`.
