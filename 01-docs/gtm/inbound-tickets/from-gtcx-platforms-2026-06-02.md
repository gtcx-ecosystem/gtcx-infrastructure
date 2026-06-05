---
title: 'Inbound — gtcx-platforms HSM #86 production keys'
status: 'acknowledged'
date: '2026-06-02'
owner: 'gtcx-infrastructure'
tags: ['gtm', 'cross-repo', 'gtcx-platforms', 'hsm']
---

# Inbound — gtcx-platforms (2026-06-02)

**From:** gtcx-platforms  
**Outbound mirror:** `gtcx-platforms/01-docs/08-gtm/outbound-tickets/to-gtcx-infrastructure-2026-06-02.md`  
**Related:** INF-49 / #49 staging **accepted**; protocols #61 production path blocked here

---

## Message

Ack **INF-49 complete** — `api.staging.gtcx.trade` health + authority DID (protocols v0.4.5). Platforms runs `pnpm protocols:smoke:staging`.

### Ask — [gtcx-infrastructure#86](https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues/86)

Progress **HSM / production key ceremony**:

- [ ] Production signing keys (sovereign CSP / protocol authority — not placeholder `key_status`)
- [ ] Runbook for platforms (env, rotation, break-glass)
- [ ] Notify when `key_status: production` is documentable in sovereign deploy guides

**Out of scope:** tickets #50–#54 (platforms ADR-007 stance)

### Platforms will not

- Claim production sovereign authority in runbooks/demos/env until **#86** + first CSP countersignature per deal (sovereign program)

## Infra agent actions — UPDATE 2026-06-03

1. ✅ **Update #86** — H-02 ceremony executed 2026-06-03T13:50:17Z
2. ✅ **Link evidence doc** — `01-docs/05-audit/evidence/inf-86/gh-bog-2026-06-03/`
3. ✅ **Ping protocols #61** — comment posted with `spki_sha256`

**Current state:** H-02 complete → protocols owns XR-403 → platforms unblocks XR-405 after protocols merge.

## Cross-ref

Protocols inbound: `gtcx-protocols/01-docs/08-gtm/inbound-tickets/from-gtcx-infrastructure-2026-06-01.md`
