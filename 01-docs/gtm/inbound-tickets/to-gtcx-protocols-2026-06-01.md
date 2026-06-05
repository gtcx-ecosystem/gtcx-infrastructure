---
title: 'Outbound — gtcx-protocols ack (INF-49 / #60)'
status: current
date: '2026-06-01'
owner: platform-lead
tier: critical
tags: ['gtm', 'outbound', 'protocols', 'inf-49']
review_cycle: on-change
---

# Outbound — gtcx-protocols (2026-06-01)

Mirror of the coordination thread. Protocols inbound ack recorded in [`from-gtcx-protocols-2026-06-01.md`](./from-gtcx-protocols-2026-06-01.md).

## Message to post (email / GitHub)

**Subject:** Re: #60 / INF-49 — ack; infra driving /health 200 next

Hi —

Acknowledged your plan. Alignment confirmed on our side.

**Agreed**

- Staging base URL: `https://api.staging.gtcx.trade`
- You own `GET /v1/dids/auth/{iso}/{slug}` → CSP authority JSON-LD (we do not implement this in gtcx-infrastructure).
- Placeholder `key_status` until [#61](https://github.com/gtcx-ecosystem/gtcx-protocols/issues/61) + infra [#86](https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues/86).
- You close **#60** when a sample authority DID resolves on staging; we close **#49** when `/health` is 200.

**Infra status (unchanged)**

- DNS + TLS to ALB: **live**
- `curl https://api.staging.gtcx.trade/health`: **403** today (ALB → `gtcx-protocols-staging:8300` target health / WAF — active workstream)
- Evidence: `01-docs/05-audit/inf-49-staging-dns-evidence-2026-06-01.md`

**What happens next**

1. We fix staging routing/target health so `/health` returns 200 (infra [#49](https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues/49)).
2. We ping **gtcx-protocols#60** with curl output + SPKI fingerprint for mobile pins.
3. You land the DID handler and verify `GET /v1/dids/auth/gh/bog` (or agreed sample) on staging.
4. **#86** HSM ceremony remains on the 4–8 week post-approval track; we will post ceremony evidence on **#61** when scheduled.

We will not ask you to close **#60** before `/health` is 200 — fair dependency.

— gtcx-infrastructure / platform
