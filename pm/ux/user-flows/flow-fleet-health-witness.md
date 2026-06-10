---
flowId: flow-fleet-health-witness
jtbdId: JTBD-fleet-health-witness
personaId: platform-operator
exrId: EXR-002
---

# Flow — Fleet health witness

## Trigger

Platform operator completes staging change, closes DaaS friction item, or session start requires substrate proof (launch focus, sprint seal).

## Happy path

1. **Operator** runs `pnpm daas:fleet:health` from repo root.
2. **System** invokes `platform/tools/scripts/cross-repo-health-probe.mjs`.
3. **System** probes configured sibling endpoints (compliance-gateway, markets, intelligence, AGX paths per manifest).
4. **System** uses IPv4 curl fallback; optional probes use in-cluster `kubectl exec` when external hostname fails.
5. **System** writes `audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json`.
6. **Operator** runs `pnpm daas:friction:check:write` — open P0 = 0.
7. **Operator** records PASS in Status Update (e.g. 4/4).

## Error / edge paths

| Branch                   | User sees          | System response                            | Recovery                                                               |
| ------------------------ | ------------------ | ------------------------------------------ | ---------------------------------------------------------------------- |
| External 525/timeout     | FAIL on hostname   | Try in-cluster fallback for optional probe | Document external CF gap; do not false-fail required in-cluster health |
| Service scaled to 0      | Connection refused | FAIL with deployment name                  | `kubectl scale` + replicas patch in overlay                            |
| Auth token empty (503)   | Health 503         | Probe captures body                        | `patch-compliance-gateway-auth-tokens.mjs`                             |
| All required probes fail | Non-zero exit      | Friction register updated                  | Fix root deployment before sealing sprint                              |

## Empty / loading / permission-denied

- **Empty probe config:** validate-all fails — fix manifest before fleet run.
- **Loading:** Probe streams per-endpoint results; partial output saved to witness JSON.
- **kubectl denied:** Permission Unblock Report — cluster context `gtcx-staging`.

## AI-native touchpoints

- Probe script is agent-executed witness — no dashboard "Run health check" as sole path.
- Results feed `pm/friction-register.json` via `daas:friction:check:write`.

## Engineering hooks

| Layer                | Path                                                 |
| -------------------- | ---------------------------------------------------- |
| Fleet health script  | `package.json` → `daas:fleet:health`                 |
| Probe implementation | `platform/tools/scripts/cross-repo-health-probe.mjs` |
| Friction register    | `pm/friction-register.json`                          |
| Evidence             | `audit/evidence/cross-repo-health/`                  |
| DAAS roadmap seal    | `pm/daas-roadmap.json` (S1–S3 complete)              |

## UAT outline

| Step                            | Maps to JTBD acceptanceCriteria |
| ------------------------------- | ------------------------------- |
| 1. Run `pnpm daas:fleet:health` | Exit 0                          |
| 2. Open latest witness JSON     | Timestamp fresh                 |
| 3. Run friction check write     | Open P0 = 0                     |
| 4. Run validate-all             | 55/55 PASS                      |

## Open questions

- **Class R:** Wire fleet probe into CI on staging merge (operator track).
- **Class S:** None.
