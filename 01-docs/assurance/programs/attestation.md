---
title: 'Program — trust attestation (gtcx-infrastructure)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
program: attestation
---

# Trust attestation program — gtcx-infrastructure

Two tracks — do not conflate:

| Track                           | System                          | Owner                                     |
| ------------------------------- | ------------------------------- | ----------------------------------------- |
| **Human/external**              | Human gates manifest + register | gtcx-agentic                              |
| **Technical (INF-86 / XR-401)** | Trust attestation runners       | gtcx-agentic → evidence in gtcx-protocols |

## gtcx-agentic runners (when this repo is agentic)

```bash
pnpm trust:attest:xr401
pnpm trust:attest:xr401:write   # Class A — after preceremony
pnpm test:trust-attestation
```

Spec: [`../../security/trust-attestation-runners.md`](../../security/trust-attestation-runners.md) (agentic only).

## Other repos

- Link INF-86 pickup docs in `evidence-index.md`
- Witness cadence only unless Class A artifact authorizes write
- Ceremony tooling: gtcx-protocols `01-docs/04-ops/coordination/`

## Agent may not

- Impersonate custodian ceremony without H-03 / authorized batch queue
- Mark XR-401 done without protocols evidence JSON path

<!-- gtcx-assurance-workspace-v1 -->
