---
title: 'Outbound — gtcx-core repo retirement hygiene'
status: 'current'
date: '2026-06-02'
owner: 'gtcx-infrastructure'
tags: ['gtm', 'cross-repo', 'gtcx-core']
---

# Outbound — gtcx-core (2026-06-02)

Filed after ecosystem repo deletions documented in [ADR-012](../architecture/decisions/ADR-012-deprecate-gtcx-core12-gtcx-amis.md).

## Ticket opened

**gtcx-core inbound:** [`from-gtcx-infrastructure-2026-06-02-repo-retirements.md`](https://github.com/gtcx-ecosystem/gtcx-core/blob/main/docs/gtm/inbound-tickets/from-gtcx-infrastructure-2026-06-02-repo-retirements.md)

## Ask

Confirm gtcx-core docs and npm surface do not reference deleted repos (`gtcx-core12`, `gtcx-amis`, Sensei mirrors). No code changes expected — audit record only.

## Remaining ADR actions (infra-owned)

- [ ] Notify `#engineering` Slack channel
- [ ] Complete `gtcx-complianceos` migration before that repo is deleted
