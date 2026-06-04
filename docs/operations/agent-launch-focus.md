---
title: 'Agent launch focus — gtcx-infrastructure'
status: current
date: 2026-06-06
owner: gtcx-infrastructure
document_id: OPS-AGENT-LAUNCH-INFRA
---

# Launch focus — gtcx-infrastructure

**Hub spec:** [gtcx-core agent-launch-focus.md](https://github.com/gtcx-ecosystem/gtcx-core/blob/main/docs/operations/agent-launch-focus.md)

**Config:** `.baseline/launch-focus.config.json` · **State:** `.baseline/launch-focus.json`

**North star:** Live pilot substrate (Wire #2, testnet, hub acks) so apps and GTM can close GR-T2 deals.

```bash
pnpm agent:start --json
pnpm agent:next-work
```

**OI-X02** (ER-1-08 infra hub ack) is on the launch implement path when gtcx-core outbound is filed.
