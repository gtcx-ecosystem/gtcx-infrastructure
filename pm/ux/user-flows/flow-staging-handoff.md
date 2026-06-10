---
flowId: flow-staging-handoff
jtbdId: JTBD-staging-substrate-ready
personaId: sibling-integrator
exrId: EXR-001
---

# Flow — Staging handoff to witness

## Trigger

Sibling repo engineer or agent files inbound coordination doc (`to-gtcx-infrastructure-<topic>-YYYY-MM-DD.md`) or hub ticket naming infra blocker (W2-OPS-001, Hub #17, XR-MKT-011).

## Happy path

1. **Integrator** states repo, environment (`staging`), and required substrate (secrets SM, ESO, ingress path, GHCR pull).
2. **Platform operator** (agent in-session) reads DaaS card: `docs/operations/daas/cards/<repo>.md`.
3. **System** runs repo script first — e.g. `platform/scripts/staging/populate-compliance-os-staging-sm.sh`.
4. **System** applies Terraform target or `kubectl apply -k deploy/kubernetes/overlays/staging/...`.
5. **System** records command + exit code; writes witness JSON if applicable.
6. **Platform operator** publishes `docs/operations/coordination/from-gtcx-infrastructure-<topic>-YYYY-MM-DD.md` linking evidence.
7. **Integrator** runs product prereq check in owner repo; confirms unblock.

## Error / edge paths

| Branch            | User sees                      | System response                      | Recovery                                       |
| ----------------- | ------------------------------ | ------------------------------------ | ---------------------------------------------- |
| AWS creds denied  | Permission Unblock Report (D6) | Agent stops — no runbook dump        | Human enables vault/profile; agent re-runs     |
| Terraform drift   | Non-zero apply exit            | Capture plan output in session notes | Targeted apply or import per module README     |
| Pod pending (CPU) | Rollout timeout                | `kubectl describe pod` evidence      | Scale down stale workload or add node capacity |
| ESO not Ready     | ExternalSecret Pending         | Check SM population script exit      | Re-run populate script; verify IRSA            |

## Empty / loading / permission-denied

- **Empty handoff:** Reject — require inbound doc with repo id and acceptance criteria from JTBD.
- **Loading:** Rollout status polls with timeout; Status Update reports partial completion.
- **Permission-denied:** File Permission Unblock Report — never "Your action needed" paste block (P27).

## AI-native touchpoints

- Custodian agents execute scripts via P27 — no "Run deploy" UI button.
- `pnpm agent:next-work` selects infra stories; Proceed Brief cites JTBD acceptance criteria.

## Engineering hooks

| Layer                 | Path                                                              |
| --------------------- | ----------------------------------------------------------------- |
| Staging scripts       | `platform/scripts/staging/*.sh`, `platform/scripts/staging/*.mjs` |
| K8s overlays          | `deploy/kubernetes/overlays/staging/`                             |
| Terraform staging     | `deploy/terraform/environments/staging/`                          |
| Coordination          | `docs/operations/coordination/`                                   |
| Agent staging runbook | `docs/operations/agent-staging-execution.md`                      |

## UAT outline

| Step                                              | Maps to JTBD acceptanceCriteria |
| ------------------------------------------------- | ------------------------------- |
| 1. File test inbound handoff for one sibling repo | Inbound acked                   |
| 2. Agent runs populate + apply sequence           | Exit codes recorded             |
| 3. Verify outbound seal exists with evidence link | Outbound seal                   |
| 4. Run sibling prereq check from owner repo       | Product check passes            |

## Open questions

- **Class R:** Automate seal generation from script exit codes (GEN-006 style).
- **Class S:** None in this flow.
