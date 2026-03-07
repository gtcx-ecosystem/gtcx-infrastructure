# UAT Plan

## Objective

Validate that all protocol MVP flows and cross-protocol integration scenarios execute correctly before release readiness signoff.

---

## Environment Requirements

| Component    | Requirement                                |
| ------------ | ------------------------------------------ |
| Node.js      | ≥ 20                                       |
| pnpm         | ≥ 9                                        |
| Redis        | Running and responding to `redis-cli ping` |
| Postgres     | Listening on localhost:5432                |
| Evidence run | `pnpm test` — all suites pass              |

Seed fixtures for identities, sites, and custody records must be loaded before running manual scenarios.

---

## UAT Scenarios

### TradePass

| Scenario                             | Method                     | Pass Criteria                                        |
| ------------------------------------ | -------------------------- | ---------------------------------------------------- |
| Create DID and issue credential      | Automated (protocol tests) | DID format valid, credential issued with signature   |
| Verify credential (expiry + status)  | Automated                  | Verification returns correct status, expiry enforced |
| Role assignment and permission check | Automated                  | Role assigned, permissions correctly scoped          |
| Offline queue behavior               | Automated                  | Enqueue, purge, drain — queue limits enforced (45d)  |
| DID document create/update/resolve   | Automated                  | All three flows pass without manual patching         |

### GeoTag

| Scenario                                  | Method    | Pass Criteria                                 |
| ----------------------------------------- | --------- | --------------------------------------------- |
| Capture GeoTag with GPS + network input   | Automated | Credential issued with combined source data   |
| Spoof detection — teleport check          | Automated | Teleportation anomaly detected and rejected   |
| Spoof detection — time jump check         | Automated | Time jump anomaly detected and rejected       |
| Licensed site registry validation         | Automated | Site status enforced at credential issuance   |
| Geofence validation (core + buffer zones) | Automated | Zone classification correct per polygon rules |

### GCI

| Scenario                        | Method    | Pass Criteria                                      |
| ------------------------------- | --------- | -------------------------------------------------- |
| Score generation (multi-domain) | Automated | Output matches defined weights, <500ms per calc    |
| Score update events             | Automated | Event schema validated, updates processed          |
| Appeals workflow                | Automated | Appeal submitted, 72h SLA tracked, decision logged |

### VaultMark

| Scenario                                 | Method    | Pass Criteria                                        |
| ---------------------------------------- | --------- | ---------------------------------------------------- |
| Custody record creation                  | Automated | Record created with valid state and signature        |
| Challenge creation + response validation | Automated | Challenge-response flow completes correctly          |
| Custody status transitions               | Automated | State machine enforced, invalid transitions rejected |
| Physical seal verification               | Automated | NFC seal model verified                              |

### PvP

| Scenario                  | Method    | Pass Criteria                                     |
| ------------------------- | --------- | ------------------------------------------------- |
| Escrow creation + locking | Automated | Escrow created and locked with correct conditions |
| Settlement execution      | Automated | PANX validation passes, settlement executes       |
| Dispute workflow (3-tier) | Automated | All three dispute tiers process correctly         |

### PANX

| Scenario                             | Method    | Pass Criteria                                          |
| ------------------------------------ | --------- | ------------------------------------------------------ |
| Oracle submissions + consensus build | Automated | 2/3 quorum reached, attestation valid                  |
| Replay protection (cross-instance)   | Automated | Duplicate submissions rejected across instances        |
| Transport adapter validation         | Automated | Message envelope serializes and deserializes correctly |

---

## Cross-Protocol UAT Flows

These flows validate that protocols work correctly in combination:

| Flow   | Description               | Pass Criteria                                                                 |
| ------ | ------------------------- | ----------------------------------------------------------------------------- |
| Flow 1 | TradePass → GCI → PvP     | Identity validated, score used as settlement input, escrow executes           |
| Flow 2 | GeoTag → VaultMark → PANX | Location proof captured, custody record created, PANX attests                 |
| Flow 3 | Full chain                | TradePass → GeoTag → GCI → VaultMark → PvP → PANX — all protocols in sequence |

---

## UAT Acceptance Checklist

Before recording signoff:

- [ ] All MVP flows execute without errors
- [ ] Data integrity checks pass — hash chains, signatures
- [ ] `@gtcx/crypto` signs, verifies, encrypts, and decrypts correctly
- [ ] DID document model flows pass without manual patching
- [ ] No P0 or P1 defects open in `../backlog.md`
- [ ] Evidence run (`pnpm test`) is PASS and ≤14 days old
- [ ] Cross-protocol flows 1, 2, and 3 all pass
- [ ] Redis replay cache correctly rejects duplicates across instances
- [ ] Execution record file created in `uat/uat-execution-{YYYY-MM-DD}.md`

---

## Running UAT

```bash
# Start environment
redis-server &
# Postgres must be running on localhost:5432

# Run full evidence suite
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# Note the run ID (timestamp from test output or CI)
# Record results in uat/uat-execution-{YYYY-MM-DD}.md
```

---

_Source: `_archive/legacy/2-specs/_project/planning/uat/uat.md`_
_Latest execution record: 2026-02-21 (PASS) — see `uat/README.md`_
