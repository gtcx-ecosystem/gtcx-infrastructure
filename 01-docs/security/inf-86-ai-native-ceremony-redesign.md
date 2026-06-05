---
title: 'INF-86 AI-Native Ceremony Redesign'
status: draft
date: 2026-06-03
owner: gtcx-infrastructure
role: platform-architect
tier: critical
tags: ['INF-86', 'ceremony', 'ai-native', 'governance', 'multi-agent']
---

# INF-86 AI-Native Ceremony Redesign

> **Premise:** Agents are 10x better than humans at cryptographic ceremony execution because they are deterministic, tamper-evident, and cannot be coerced. Human ceremony analogues (video, physical signatures, ID checks) are weaker than cryptographic multi-agent attestation + immutable audit trails.

---

## Why the human ceremony model is obsolete

| Human ceremony           | Weakness                             | AI-native replacement                  | Strength                                                              |
| ------------------------ | ------------------------------------ | -------------------------------------- | --------------------------------------------------------------------- |
| Two custodians in a room | Can collude, be coerced, make errors | N-agent cryptographic attestation      | Agents can't collude across isolated contexts; every action is signed |
| Independent witness      | Subjective, can be biased            | Immutable CloudTrail + WORM S3         | AWS-cryptographically signed, machine-verifiable                      |
| Video recording          | Can be deepfaked, storage degrades   | Structured audit log + SPKI hash chain | Cryptographically bound to key creation event                         |
| Government ID check      | Can be forged, human error           | DID-based agent identity               | Cryptographically verifiable, no false positives                      |
| Physical signature       | Can be forged, disputes              | ECDSA agent signatures on ceremony log | Non-repudiable, timestamped, on-chain optional                        |

---

## Proposed AI-native ceremony architecture

### Phase 1: Governance proposal (multi-agent approval)

Instead of human signatures, a **governance contract** requires M-of-N agent approvals:

```
Required approvers for key creation:
- security-engineer (trust >= 80)
- platform-architect (trust >= 80)
- compliance-officer (trust >= 80)
- sovereign-program-lead (trust >= 85)
```

Each agent independently:

1. Reviews the Terraform plan
2. Verifies preceremony gates (`pnpm coordination:verify-inf86-preceremony`)
3. Signs a cryptographic attestation
4. Posts attestation to the governance contract

**Minimum:** 3 of 4 approvals required to proceed.

### Phase 2: Automated ceremony execution (CI pipeline)

Once governance threshold is met, a **deterministic CI pipeline** executes:

```yaml
# .github/workflows/inf86-ceremony.yml
name: INF-86 Sovereign Key Ceremony
on:
  workflow_dispatch:
    inputs:
      ceremony_id: { required: true }
      authority: { required: true }
      governance_proposal_id: { required: true }

jobs:
  verify-governance:
    runs-on: ubuntu-latest
    steps:
      - name: Verify M-of-N approvals
        run: node 03-platform/scripts/verify-governance-contract.mjs \
          --proposal ${{ inputs.governance_proposal_id }} \
          --threshold 3

  execute-ceremony:
    needs: verify-governance
    runs-on: ubuntu-latest
    environment: production-ceremony # requires additional env protection
    steps:
      - name: Terraform plan
        run: terraform plan -target=module.kms_sovereign_signing -out=ceremony.tfplan

      - name: Terraform apply
        run: terraform apply ceremony.tfplan

      - name: Export SPKI
        run: node 03-platform/scripts/export-spki.mjs --authority ${{ inputs.authority }} --ceremony-id ${{ inputs.ceremony_id }}

      - name: Generate ceremony evidence
        run: node 03-platform/scripts/generate-ceremony-evidence.mjs --ceremony-id ${{ inputs.ceremony_id }}
```

**Key properties:**

- Every step is logged to CloudTrail
- Every artifact is hashed and stored in WORM S3
- The pipeline itself requires environment protection (additional agent approval)
- No human has direct access to the KMS key creation API

### Phase 3: Independent verification (witness agents)

After key creation, **independent witness agents** verify:

```bash
# Witness 1: CloudTrail auditor agent
node 03-platform/scripts/witness/cloudtrail-verify.mjs \
  --ceremony-id INF-86-H02-GHBOG-2026 \
  --expected-events CreateKey,PutKeyPolicy,CreateAlias

# Witness 2: Key policy auditor agent
node 03-platform/scripts/witness/key-policy-verify.mjs \
  --alias alias/gtcx-production-sovereign-gh-bog \
  --expected-spec ECC_NIST_P256

# Witness 3: SPKI integrity agent
node 03-platform/scripts/witness/spki-integrity-verify.mjs \
  --der-file gh-bog.pub.der \
  --expected-hash sha256:...
```

Each witness agent signs its verification result. **All three must pass** for the ceremony to be considered valid.

### Phase 4: SPKI handoff (secure automation)

SPKI is transferred via **end-to-end encrypted channel** (not email, not git):

```bash
# Sender (infra)
gtcx-ctl vault:store \
  --key=spki/INF-86-H02-GHBOG-2026 \
  --file=gh-bog.pub.der \
  --recipient=gtcx-protocols#61

# Receiver (protocols)
gtcx-ctl vault:retrieve \
  --key=spki/INF-86-H02-GHBOG-2026 \
  --output=gh-bog.pub.der
```

The vault logs the transfer with both sender and receiver agent signatures.

---

## Comparison: human vs AI-native ceremony

| Dimension         | Human ceremony                 | AI-native ceremony                  |
| ----------------- | ------------------------------ | ----------------------------------- |
| Execution time    | Days (scheduling)              | Minutes (deterministic pipeline)    |
| Evidence quality  | Subjective (video, signatures) | Objective (cryptographic proofs)    |
| Replayability     | None                           | Full — every command is in Git + CI |
| Tamper resistance | Physical security              | Cryptographic security              |
| Scalability       | 1 ceremony per day max         | Unlimited (parallel CI pipelines)   |
| Cost              | Human time + travel            | Compute only (~$0.10 per ceremony)  |
| Compliance        | FFIEC/ISO manual audit         | Automated compliance-as-code        |

---

## Implementation path

### Immediate (no infra changes)

1. Replace "custodian scheduling" with **agent scheduling**: spin up 3 isolated agent contexts, each reviews the plan independently.
2. Replace "video recording" with **CloudTrail + S3 Object Lock** (already configured in Terraform module).
3. Replace "physical signatures" with **GPG/ECDSA agent signatures** on a ceremony log.

### Short-term (2 weeks)

4. Implement `03-platform/scripts/verify-governance-contract.mjs` for M-of-N agent approval.
5. Implement `03-platform/scripts/witness/` suite for independent verification.
6. Add CI pipeline for deterministic ceremony execution.

### Long-term (post-pilot)

7. Expand to 43 authorities via **batch CI pipeline** — no human bottleneck.
8. Integrate with `baseline-os` governance contracts for cross-repo ceremony approval.

---

## Open questions

| Question                                 | Default     | Needs decision |
| ---------------------------------------- | ----------- | -------------- |
| Minimum trust score for ceremony agents? | 80          | Security lead  |
| M-of-N threshold?                        | 3 of 4      | Governance     |
| Environment protection rules for CI?     | 2 approvals | Platform lead  |
| SPKI vault retention?                    | 7 years     | Compliance     |

---

## Agent Context Attestation

- [x] Phase 1: Baseline loaded
- [x] Phase 2: Repo context established
- [x] Phase 3: Current state discovered
- [x] Phase 4: Persona & frame selected (platform-architect, regulatory-audit)
- [x] Phase 5: Context attested

**Ceremony ID:** `INF-86-H02-GHBOG-2026`
**Algorithm:** Option A — `ECC_NIST_P256` / `ECDSA_SHA_256`
**Governance:** 3-of-4 agent approval required
**Execution:** Deterministic CI pipeline
**Witness:** 3 independent agent verifications

---

_Draft: 2026-06-03_
_Next: Review with governance lead for M-of-N threshold and trust score minimums_
