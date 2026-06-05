---
title: 'Inbound copy — W2 secrets (exploration-os consumer, hub #17.1)'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
from: exploration-os
to: gtcx-infrastructure
hub_blocker: 17
---

# Inbound copy — exploration-os W2 secrets (hub #17.1)

**Canonical in exploration-os:** `exploration-os/01-docs/04-ops/coordination/to-gtcx-infrastructure-w2-secrets-inbound-2026-06-04.md`

**Canonical sealing spec:** `compliance-os/01-docs/04-ops/coordination/to-gtcx-infrastructure-w2-secrets-inbound-2026-06-04.md`

**Summary:** exploration-os confirms `COMPLIANCE_OS_INTAKE_API_KEY` + `COMPLIANCE_OS_URL` for `npm run w2:prod:retest`. Terminal/internal tokens and pod scope are defined in compliance-os inbound. Post infra evidence, then exploration-os runs retest → `w2-hub-17-retest-latest.json` with `ok: true`.
