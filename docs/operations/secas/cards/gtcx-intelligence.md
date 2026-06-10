# SECaaS card — gtcx-intelligence

**Sovereign parallel:** `BL-SOC2-01` / `INT-S12-03` (approval-needed — blocksIR false)

## Stack security actions (gtcx-infrastructure)

1. Staging deployment secrets via ESO — no plaintext in manifests
2. Cost-router image security surface (DAAS F6 overlap)
3. Pen-test scope includes intelligence staging endpoints

## Product handoff

Runtime secret or staging auth failures → `to-gtcx-infrastructure-intelligence-*.md`

## Re-probe

`pnpm daas:fleet:health` — intelligence staging probe after seal.
