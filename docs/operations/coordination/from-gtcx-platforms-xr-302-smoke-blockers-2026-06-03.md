---
title: 'Inbound — XR-302 P4-07 smoke blockers from gtcx-platforms'
status: open
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
[`gtcx-platforms/docs/operations/coordination/to-gtcx-infrastructure-xr-302-smoke-blockers-2026-06-03.md`](../../../../gtcx-platforms/docs/operations/coordination/to-gtcx-infrastructure-xr-302-smoke-blockers-2026-06-03.md)

**Reply template (infra fills):**  
[`gtcx-platforms/docs/operations/coordination/from-gtcx-infrastructure-xr-302-smoke-blockers-TEMPLATE.md`](../../../../gtcx-platforms/docs/operations/coordination/from-gtcx-infrastructure-xr-302-smoke-blockers-TEMPLATE.md)

## Blockers (summary)

1. **Cloudflare 526** — `sovereign-staging.gtcx.trade` external health
2. **JWT placeholder** — `SECRET_KEY_BASE=PLACEHOLDER_OVERRIDE_IN_OVERLAY` on sovereign pod
3. **DB schema** — `relation "audit_records" does not exist` in sovereign logs

## Status (2026-06-03T09:30Z)

**Platforms XR-301:** done — `gtcx-sovereign:staging` + `gtcx-agx:staging-amd64` Running. **Infra XR-302:** blocking CR-1/CR-2/P4-07 smoke.

| Blocker                                                | Infra status |
| ------------------------------------------------------ | ------------ |
| 1 Edge SSL (CF 526)                                    | open         |
| 2 Secrets (`SECRET_KEY_BASE` + `TRADEPASS_JWT_SECRET`) | open         |
| 3 Migrations (`audit_records`)                         | open         |

_Update this table and post `from-gtcx-infrastructure-xr-302-smoke-blockers-YYYY-MM-DD.md` when done._
