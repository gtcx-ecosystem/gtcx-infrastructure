---
title: 'Outbound — ExplorationOS W2 + verifier dependencies resolved/tracked'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
from: gtcx-infrastructure
to: exploration-os
priority: P1
work_ids: [XR-507, XR-508, XR-502, W2-E2E]
---

# Outbound: ExplorationOS dependency resolution (gtcx-infrastructure)

**Reply to:** Hub P1 items #15–18 and `from-gtcx-protocols-cross-repo-unblock-2026-06-03.md`

---

## Dependency matrix

| Hub # | Work ID     | What exploration-os needs            | Infra status                  | Blocker                | Next action             |
| ----- | ----------- | ------------------------------------ | ----------------------------- | ---------------------- | ----------------------- |
| 15    | XR-EO-003   | F-51 lender webhook deploy + secrets | **Not infra-owned**           | TBD ops                | Escalate to ops owner   |
| 16    | XR-EO-004   | TerraOS live permit adapters         | **Not infra-owned**           | terra-os deferred      | Escalate to terra-os    |
| 17    | W2 prod E2E | Bearer + secrets + receiver          | **READY** — see details below | None on infra          | ExplorationOS runs E2E  |
| 18    | W2-C03      | Postgres persistence proof           | **Not infra-owned**           | terminal-os / prod ops | Escalate to terminal-os |
| —     | XR-507      | SIR verifier DNS                     | **DONE** (2026-06-05)         | —                      | Smoke PASS              |
| —     | XR-508      | Supabase prod migrations             | **DONE** (2026-06-05)         | —                      | Table queryable         |

---

## W2 prod E2E — infra readiness (item #17)

### Bearer token infrastructure

| Component                         | Status     | Evidence                                                                                      |
| --------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| Compliance-gateway K8s deployment | ✅ Running | `compliance-gateway-staging` pod 1/1 in `gtcx-staging`                                        |
| Bearer auth middleware            | ✅ Live    | `03-platform/tools/compliance-gateway/03-platform/src/auth.mjs` — constant-time compare, IRSA |
| Ingress route (`/audit`)          | ✅ Live    | `geotag.staging.gtcx.trade/audit` → compliance-gateway:8500                                   |

### Secrets

| Secret                         | Location                                 | Status                                                                |
| ------------------------------ | ---------------------------------------- | --------------------------------------------------------------------- |
| `COMPLIANCE_OS_INTAKE_API_KEY` | AWS SM + ESO                             | **Ready to seal** — infra action on inbound ticket from compliance-os |
| `TRADEPASS_JWT_SECRET`         | AWS SM `gtcx-secrets-staging-cdkk972mcc` | ✅ Live in staging pods                                               |
| `SECRET_KEY_BASE`              | AWS SM `gtcx-secrets-staging-cdkk972mcc` | ✅ Live in staging pods                                               |

### Receiver infrastructure

| Component                           | Status   |
| ----------------------------------- | -------- |
| K8s namespace (`gtcx-staging`)      | ✅ Ready |
| Service mesh (Linkerd)              | ✅ Ready |
| WAF (`gtcx-staging-waf-af-south-1`) | ✅ Ready |
| RDS Postgres (`gtcx_staging`)       | ✅ Ready |

**Conclusion:** Infra has no blockers for W2 prod E2E. The compliance-gateway receiver is deployed, secrets are live, and the database is up. ExplorationOS can proceed with E2E testing.

---

## Blocked on external (infra cannot advance)

### XR-507 — SIR verifier DNS

- **Status:** DONE (2026-06-05)
- **Evidence:** `https://verify.explorationos.gtcx.trade/sir/` → HTTP 200, pepper present
- **Action:** None — live and serving

### XR-508 — Supabase prod migrations

- **Status:** DONE (2026-06-05)
- **Evidence:** Project `lolfkclpuvccntgtzwaj` active; `/rest/v1/financing_applications?limit=0` → HTTP 200
- **Action:** None — table exists and queryable

---

## What exploration-os should do next

1. **W2 E2E:** Run end-to-end flow against `geotag.staging.gtcx.trade/audit` or compliance-gateway ClusterIP. Bearer tokens available via `gtcx-secrets-staging`.
2. **Verifier DNS:** ✅ Done — no further action.
3. **Supabase:** ✅ Done — no further action.

---

## Cross-references

- Hub P1 register: `gtcx-docs/01-docs/governance/.../hub-p1-register.md`
- Protocols unblock doc: `gtcx-protocols/01-docs/04-ops/coordination/from-gtcx-protocols-cross-repo-unblock-2026-06-03.md`
- Infra remaining work: `gtcx-infrastructure/01-docs/04-ops/coordination/remaining-cross-repo-work-2026-06-03.md`
- Sprint workplan: `gtcx-infrastructure/01-docs/04-ops/coordination/cross-repo-sprint-workplan-2026-06.md`
