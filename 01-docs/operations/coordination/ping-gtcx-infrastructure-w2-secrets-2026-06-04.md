---
title: 'Ping — W2 prod E2E secrets confirmation (gtcx-infrastructure)'
status: current
date: 2026-06-04
owner: gtcx-infrastructure
from: compliance-os coordination hub
to: gtcx-infrastructure
work_id: W2-E2E / #17
priority: P1
---

# Ping: W2 licence-intelligence secrets — infra confirmation

**Inbound received:** [from-compliance-os-w2-secrets-spec-2026-06-04.md](./from-compliance-os-w2-secrets-spec-2026-06-04.md) → full spec in compliance-os `to-gtcx-infrastructure-w2-secrets-inbound-2026-06-04.md`.

**Context:** Locker #17 W2 prod E2E requires three sibling confirmations. This document is the **gtcx-infrastructure** leg.

**What hub needs from infra:**
Confirm `COMPLIANCE_OS_INTAKE_*` + `COMPLIANCE_OS_TERMINAL_*` (+ internal token) exist in production (or staging-for-prod) and are injectable into compliance-gateway pods.

---

## Secret inventory

| Secret           | Expected env var                 | Location                  | Status              | Infra can confirm                                  |
| ---------------- | -------------------------------- | ------------------------- | ------------------- | -------------------------------------------------- |
| Intake API key   | `COMPLIANCE_OS_INTAKE_API_KEY`   | AWS SM → ESO → K8s secret | **Not yet sealed**  | ❌ — needs compliance-os inbound ticket with value |
| Terminal API key | `COMPLIANCE_OS_TERMINAL_API_KEY` | AWS SM → ESO → K8s secret | **Not yet defined** | ❌ — needs compliance-os spec                      |
| Internal token   | `COMPLIANCE_OS_INTERNAL_TOKEN`   | AWS SM → ESO → K8s secret | **Not yet defined** | ❌ — needs compliance-os spec                      |

---

## What infra has ready today

| Component                     | Status     | Evidence                                                                             |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| AWS SM + ESO sync             | ✅ Live    | `gtcx-sovereign-secrets-staging`, `gtcx-compliance-gateway-audit-key-staging` proven |
| K8s secret injection pattern  | ✅ Proven  | `secretKeyRef` → pod env in `compliance-gateway-staging-env.yaml`                    |
| Compliance-gateway deployment | ✅ Running | `compliance-gateway-staging-69ccd6c867-24sjs` Ready                                  |
| Bearer auth middleware        | ✅ Live    | `auth.mjs` constant-time compare, IRSA-backed                                        |

---

## What infra needs from compliance-os

1. **Exact env var names** — Confirm `COMPLIANCE_OS_INTAKE_API_KEY`, `COMPLIANCE_OS_TERMINAL_API_KEY`, `COMPLIANCE_OS_INTERNAL_TOKEN` (or propose alternatives).
2. **Values or generation method** — Either:
   - Provide the secret values (infra will seal in AWS SM), **or**
   - Specify generation rules (length, charset, entropy) and infra will generate + seal.
3. **Target environment** — Staging (for E2E) or production (or both).
4. **Pod scope** — Which deployment(s) need these env vars?
   - `compliance-gateway` only?
   - `sovereign`?
   - Other pods?

---

## Infra action on receipt

1. Seal values in AWS Secrets Manager (`af-south-1`).
2. Create or update K8s Secret in target namespace (`gtcx-staging` or `gtcx-production`).
3. Patch relevant Deployment manifests with `env.valueFrom.secretKeyRef`.
4. Rolling-restart affected pods.
5. Post evidence (secret names, pod names, env verification) back to this thread.

---

## Cross-references

- ExplorationOS retest: `ping-exploration-os-w2-m2m-wire-2026-06-03.md`
- TerminalOS receiver: `ping-terminal-os-w2-xr505-2026-06-03.md`
- Infra W2 readiness: `to-exploration-os-w2-dependencies-2026-06-03.md` § W2 prod E2E
- Hub P1 register: `gtcx-docs/01-docs/governance/.../hub-p1-register.md`
