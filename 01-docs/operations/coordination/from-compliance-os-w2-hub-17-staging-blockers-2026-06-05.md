---
title: 'Inbound — W2 hub #17 staging deploy blockers (from compliance-os)'
status: archived
date: 2026-06-05
archived_date: 2026-06-08
from: compliance-os
to: gtcx-infrastructure
owner: gtcx-infrastructure
priority: P1
hub_blocker: 17
er1: ER-1-10
work_id: W2-E2E
canonical_source: compliance-os/01-docs/04-ops/coordination/to-gtcx-infrastructure-w2-hub-17-staging-blockers-2026-06-05.md
infra_reply: 01-docs/04-ops/coordination/to-compliance-os-hub-17-staging-blockers-witness-2026-06-05.md
blocking: false
---

# Inbound received — staging blockers (archived)

> **Archived 2026-06-08** — staging Phase A **closed**. Infra witness delivered; `pnpm w2:staging-prereq-check` green; exploration retest **201**, PATCH **200**, terminal live **PASS**. **Current blocker:** prod Phase B — see [`outbound/hub-17-prod-w2-close-raise-2026-06-08.md`](./outbound/hub-17-prod-w2-close-raise-2026-06-08.md).

**Canonical source:** [compliance-os `to-gtcx-infrastructure-w2-hub-17-staging-blockers-2026-06-05.md`](https://github.com/gtcx-ecosystem/compliance-os/blob/main/01-docs/04-ops/coordination/to-gtcx-infrastructure-w2-hub-17-staging-blockers-2026-06-05.md)

**Infra reply:** [`to-compliance-os-hub-17-staging-blockers-witness-2026-06-05.md`](./to-compliance-os-hub-17-staging-blockers-witness-2026-06-05.md)

---

## Original asks (resolved)

### Ask 1 — GHCR image pull (P0) — **closed**

- `compliance-os-ghcr-pull` bound; pull-auth resolved.
- Remaining image tag publish was **compliance-os** CD scope.

### Ask 2 — Non-W2 staging secrets (P1) — **closed**

- ESO paths for `compliance-api`, `caas`, `core12`, `via`, `vxa`, `minio` delivered via Terraform + `external-secrets.yaml`.
- Bootstrap: [`staging-compliance-os-eso-bootstrap.md`](../staging-compliance-os-eso-bootstrap.md).

---

## Staging evidence (retained)

| Artifact               | Path                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| W2 secrets sealed      | [`from-gtcx-infrastructure-w2-secrets-sealed-2026-06-05.md`](./from-gtcx-infrastructure-w2-secrets-sealed-2026-06-05.md) |
| Terminal key alignment | cross-repo-agent-log `3a794fa`                                                                                           |
| Exploration retest     | compliance-os `w2-hub-17-exploration-retest-pointer.md`                                                                  |
| PATCH proof            | compliance-os `w2-hub-17-cos-patch-latest.json`                                                                          |

**Prod close** tracked separately — not blocked on staging asks.
