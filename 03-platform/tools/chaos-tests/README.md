# `03-platform/tools/chaos-tests/` — Resilience chaos fixtures

Node test fixtures for offline-queue and restart semantics. Invoked from `04-ship/03-platform/scripts/validate.sh` (ADR-019 exemption — single-purpose, not a workspace package).

| File                             | Purpose                                 |
| -------------------------------- | --------------------------------------- |
| `offline-queue-restart.test.mjs` | Offline queue restart safety regression |

**Related:** [`03-platform/tools/chaos/`](../chaos/README.md) (network partition tests) · [`03-platform/tools/replay-protection/`](../replay-protection/README.md)
