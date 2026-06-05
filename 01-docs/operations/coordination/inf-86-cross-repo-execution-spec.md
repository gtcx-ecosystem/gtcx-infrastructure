---
title: 'INF-86 Cross-Repo Execution Spec'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
to: all repos
priority: P0
work_ids: [XR-401, XR-402, XR-403]
---

# INF-86 Cross-Repo Execution Spec

> **Goal:** Every repo knows exactly what they must do next to unblock the INF-86 sovereign key chain.
> **Ceremony ID:** `INF-86-H02-GHBOG-2026`
> **Algorithm:** Option A — `ECC_NIST_P256` / `ECDSA_SHA_256`
> **Authority:** `gh-bog` (Ghana Bogoso)

---

## Phase map

```
H-01 (governance) → H-02 (infra ceremony) → H-03 (protocols XR-403) → H-04 (exploration + platforms)
```

| Phase | Status                       | What unblocks it                               |
| ----- | ---------------------------- | ---------------------------------------------- |
| H-01  | **4/4 done**                 | Agentic attestation A/B/C + algorithm sign-off |
| H-02  | **Done** 2026-06-03T13:50:17 | Terraform applied, SPKI exported               |
| H-03  | **Ready**                    | Protocols to execute XR-403                    |
| H-04  | Blocked                      | H-03 protocols merge                           |

---

## Per-repo next actions

### gtcx-infrastructure (lead: H-02)

| #   | Action                                 | Blocker               | ETA                  | Status |
| --- | -------------------------------------- | --------------------- | -------------------- | ------ |
| 1   | Schedule custodians + witness          | Agentic roster        | Done                 | ✅     |
| 2   | Obtain GTCX-KEY-CEREMONY approval      | Agentic authorization | Done                 | ✅     |
| 3   | Execute H-02 ceremony (8-step runbook) | #1 + #2               | 2026-06-03T13:50:17Z | ✅     |
| 4   | Export SPKI DER + handoff to protocols | #3                    | 2026-06-03T13:51Z    | ✅     |
| 5   | Post ceremony evidence to tracker      | #3                    | 2026-06-03T13:51Z    | ✅     |
| 6   | Baseline-os report-work                | #5                    | Done                 | ✅     |

**Artifacts:** `01-docs/05-audit/inf-86-ceremony-tracker.md`, `01-docs/09-security/inf-86-h02-operator-runbook.md`

---

### gtcx-protocols (lead: H-03 / XR-403)

| #   | Action                                                                     | Blocker        | ETA                |
| --- | -------------------------------------------------------------------------- | -------------- | ------------------ |
| 1   | Verify preceremony green                                                   | None — run now | Done               |
| 2   | Receive SPKI DER from infra                                                | H-02           | After ceremony     |
| 3   | Convert SPKI → JWK / publicKeyMultibase                                    | #2             | Same day           |
| 4   | Open XR-403 PR: `bog.json` + DID document update                           | #2             | Within 48h of SPKI |
| 5   | Flip `key_status: production`, VM type `EcdsaSecp256r1VerificationKey2019` | #4             | In PR              |
| 6   | Verify `pnpm check:csp-authority-keys` + `authority-did-docs` green        | #4             | In CI              |

**Artifacts:** `01-docs/04-ops/coordination/to-gtcx-infrastructure-inf-86-ceremony-2026-06-03.md`, `inf-86-pilot-gh-bog-protocols-runbook-2026-06-02.md`

**Trigger command when SPKI ready:**

```bash
pnpm coordination:xr-403-checklist --ceremony-id=ceremony:INF-86-H02-GHBOG-2026
```

---

### gtcx-platforms (lead: H-04)

| #   | Action                                     | Blocker    | ETA                |
| --- | ------------------------------------------ | ---------- | ------------------ |
| 1   | Align `kms.provider.ts` to `ECDSA_SHA_256` | H-03 merge | After protocols PR |
| 2   | Verify signing against same KMS alias      | #1         | In PR              |

---

### exploration-os (lead: H-04)

| #   | Action                                                | Blocker    | ETA                |
| --- | ----------------------------------------------------- | ---------- | ------------------ |
| 1   | Re-run `contract:gtcx` regression                     | H-03 merge | After protocols PR |
| 2   | Verify `verify.explorationos.gtcx.trade` still passes | #1         | In CI              |

---

### gtcx-agentic (lead: attestation)

| #   | Action                        | Blocker | ETA                 |
| --- | ----------------------------- | ------- | ------------------- |
| 1   | XR-401-A dual attestation     | None    | **Done**            |
| 2   | Monitor H-02 preceremony gate | H-01    | Run before ceremony |

**Artifacts:** `03-platform/scripts/trust-attestation/merge-xr401-attestation.mjs`

---

## Handoff protocol

### H-02 → H-03 (infra → protocols)

When SPKI is ready, infra signals:

```markdown
SPKI ready

- ceremony_id: INF-86-H02-GHBOG-2026
- kms_alias: alias/gtcx-production-sovereign-gh-bog
- algorithm: ECC_NIST_P256 / ECDSA_SHA_256
- spki_handoff: <secure channel — not in git>
- log: 01-docs/05-audit/inf-86-ceremony-tracker.md
```

Protocols then runs:

```bash
cd gtcx-protocols
pnpm coordination:xr-403-checklist --ceremony-id=ceremony:INF-86-H02-GHBOG-2026
```

---

## Shared blockers

| Blocker                    | Affected repos         | Owner           | Unblocks |
| -------------------------- | ---------------------- | --------------- | -------- |
| Custodian scheduling       | infra                  | Compliance lead | H-02     |
| GTCX-KEY-CEREMONY approval | infra                  | Leadership      | H-02     |
| SPKI delivery              | protocols              | infra           | H-03     |
| Protocols XR-403 merge     | platforms, exploration | protocols       | H-04     |

---

_Last updated: 2026-06-03_
_Next update: After H-01 unblocks or SPKI handoff_
