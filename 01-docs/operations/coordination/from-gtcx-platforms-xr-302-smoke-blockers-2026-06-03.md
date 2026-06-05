---
title: 'Inbound — XR-302 P4-07 smoke blockers from gtcx-platforms'
status: done
date: 2026-06-03
owner: gtcx-infrastructure
from: gtcx-platforms
to: gtcx-infrastructure
priority: P0
work_ids: [XR-302]
---

# Inbound from gtcx-platforms — XR-302 smoke blockers

**Action required:** Resolve three blockers so platforms can run `pnpm smoke:signed-edge-tenant:evidence` and close P4-07.

**Canonical ticket (platforms outbound):**  
[`gtcx-platforms/01-docs/04-ops/coordination/to-gtcx-infrastructure-xr-302-smoke-blockers-2026-06-03.md`](../../../../gtcx-platforms/01-docs/04-ops/coordination/to-gtcx-infrastructure-xr-302-smoke-blockers-2026-06-03.md)

**Reply template (infra fills):**  
[`gtcx-platforms/01-docs/04-ops/coordination/from-gtcx-infrastructure-xr-302-smoke-blockers-TEMPLATE.md`](../../../../gtcx-platforms/01-docs/04-ops/coordination/from-gtcx-infrastructure-xr-302-smoke-blockers-TEMPLATE.md)

## Blockers (summary)

1. **Cloudflare 526** — `sovereign-staging.gtcx.trade` external health
2. **JWT placeholder** — `SECRET_KEY_BASE=PLACEHOLDER_OVERRIDE_IN_OVERLAY` on sovereign pod
3. **DB schema** — `relation "audit_records" does not exist` in sovereign logs

## Status (2026-06-03T09:30Z → 2026-06-03T10:30Z)

**All blockers resolved.** Platforms can now run `pnpm smoke:signed-edge-tenant:evidence`.

| Blocker                                                        | Infra status | Evidence                                                                                          |
| -------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| 1 Edge SSL (CF 526)                                            | **done**     | `sovereign-staging.gtcx.trade/api/health` → 200; `api.staging.gtcx.trade/api/health` → 200        |
| 2 Secrets (`SECRET_KEY_BASE` + `TRADEPASS_JWT_SECRET`)         | **done**     | AWS SM `gtcx-secrets-staging-cdkk972mcc` updated; pods rolling-restarted; env verified            |
| 3 Migrations (`audit_records` + `outbox` + `idempotency_keys`) | **done**     | K8s Job `migrate-shared-entities` created all 3 tables + indexes; pods restarted; no more `42P01` |

**Reply posted:** [`from-gtcx-infrastructure-xr-302-smoke-blockers-2026-06-03.md`](from-gtcx-infrastructure-xr-302-smoke-blockers-2026-06-03.md)
