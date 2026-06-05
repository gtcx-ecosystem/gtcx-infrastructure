---
title: 'Outbound — Hub #17 prod close witness (baseline-os tracking)'
status: closed
date: 2026-06-08
owner: gtcx-infrastructure
from: gtcx-infrastructure
to: baseline-os
priority: P1
hub_blocker: 17
er1: ER-1-10
authority_class: R
tags: ['coordination', 'witness', 'hub-17']
---

# Outbound — Hub #17 prod close witness

**Role:** Coordination tracking only — **not** approval. Infra owns Class A execution; baseline-os holds hub locker until prod evidence rows are green.

**Copy target (when bundle complete):** `baseline-os/workstream/coordination/inbound/from-compliance-os-w2-locker-17-2026-06-04.md` — finalize from [compliance-os draft](https://github.com/gtcx-ecosystem/compliance-os/blob/main/01-docs/04-ops/coordination/hub-inbound-w2-locker-17-draft-2026-06-04.md).

**Infra raise (owner):** [`hub-17-prod-w2-close-raise-2026-06-08.md`](./hub-17-prod-w2-close-raise-2026-06-08.md)

---

## Evidence bundle tracker

| #   | Owner               | Staging                     | Prod                                    | Blocker |
| --- | ------------------- | --------------------------- | --------------------------------------- | ------- |
| 1   | exploration-os      | ☑ staging PF                | ☑ **201** @ `compliance.gtcx.trade`     | none    |
| 2   | gtcx-infrastructure | ☑ ESO + 7 W2 keys           | ☑ prod secrets + dual ingress           | none    |
| 3   | compliance-os       | ☑ PATCH 200 staging         | ☑ PATCH **200** prod                    | none    |
| 4   | terminal-os         | ☑ `431a2169` + live staging | ☑ PATCH **200** @ `terminal.gtcx.trade` | none    |

**Hub #18** remains separate: prod `POSTGRES_URL` + persistence proof.

---

## Suggested hub actions (when all prod rows ☑)

1. Close blocker **#17** in `baseline-os/workstream/index/blockers.md`.
2. Append `baseline-os/workstream/coordination/cross-repo-agent-log.md` — ER-1-10 / #17 closed.
3. Refresh `coordination-report-latest.md` — remove compliance-os #17 agentic blocker row.
4. Leave **#18** open.

---

## Downstream retest commands (Class R — post-infra)

```bash
# exploration-os
export COMPLIANCE_OS_URL=https://compliance.gtcx.trade
export COMPLIANCE_OS_INTAKE_API_KEY=<from infra SM path>
npm run w2:prod:retest

# compliance-os
export COMPLIANCE_OS_TERMINAL_OS_URL="https://<terminal-prod>"
export COMPLIANCE_OS_TERMINAL_API_KEY="<from-vault>"
pnpm w2:terminal-patch-proof
```
