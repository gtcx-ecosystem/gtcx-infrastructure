---
title: 'Inbound — W2 hub #17 secrets spec (from compliance-os)'
status: current
date: 2026-06-05
from: compliance-os
to: gtcx-infrastructure
priority: P1
hub_blocker: 17
---

# Inbound received — W2 prod secrets

**Full specification (canonical):**  
[`compliance-os/docs/operations/coordination/to-gtcx-infrastructure-w2-secrets-inbound-2026-06-04.md`](../../../compliance-os/docs/operations/coordination/to-gtcx-infrastructure-w2-secrets-inbound-2026-06-04.md)

**Hub copy:** `baseline-os/workstream/coordination/inbound/from-compliance-os-w2-secrets-spec-2026-06-04.md`

## Action

1. Generate and seal secrets per compliance-os §2 (no values in git).
2. Inject into deployment serving `apps/web` at `https://compliance.gtcx.trade`.
3. Use `COMPLIANCE_API_INTERNAL_TOKEN` (not `COMPLIANCE_OS_INTERNAL_TOKEN`).
4. Post evidence checklist back to compliance-os ping thread.

**Responds to:** [ping-gtcx-infrastructure-w2-secrets-2026-06-04.md](./ping-gtcx-infrastructure-w2-secrets-2026-06-04.md)
