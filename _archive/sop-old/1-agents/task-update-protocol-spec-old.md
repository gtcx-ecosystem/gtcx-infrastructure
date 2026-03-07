# Task: Update Protocol Spec

Role: Protocol Architect

---

## When to Use This Task

- A protocol implementation changed and the spec does not reflect it
- A new capability is being added to an existing protocol
- A cross-protocol integration contract is being modified
- Correcting an error or ambiguity in an existing spec

---

## Pre-Flight

Before touching any spec:

- [ ] Read the current `protocols/<protocol>/SPEC.md` in full
- [ ] Read `_sop/2-docs/2-specs/protocol-index.md` — confirm cross-protocol relationships
- [ ] Identify whether the change is behavioral (requires human approval) or documentation-only (autonomous)
- [ ] If behavioral: stop and get human approval before proceeding
- [ ] If cross-protocol: identify all downstream protocol specs that may also need updating

---

## Steps

### 1. Understand what changed

Read the relevant source files to confirm the current implementation:

```bash
# Find the implementation files for the protocol
ls protocols/<protocol>/src/

# Read the specific files affected
# e.g.: protocols/tradepass/src/credentials.ts
```

Do not update the spec based on memory or assumption. Read the code.

### 2. Draft the spec change

Update `protocols/<protocol>/SPEC.md`:

- Keep the existing structure — do not reorganize without a reason
- Be precise about behavior: inputs, outputs, preconditions, postconditions
- For state machine changes, update the state diagram
- For permission changes, update the permissions table
- If an existing cross-protocol reference is affected, update it here and flag the downstream specs

### 3. Check cross-protocol impact

If the change affects:

| Change                      | Check These                            |
| --------------------------- | -------------------------------------- |
| VaultMark asset creation    | GeoTag origin anchor requirement       |
| PvP escrow conditions       | GCI score gate reference               |
| PANX consensus quorum       | All high-value operation thresholds    |
| TradePass permission scopes | All protocol handler permission checks |

Update `_sop/2-docs/2-specs/protocol-index.md` if integration contracts change.

### 4. Propose an ADR if needed

If the change involves a significant architectural decision, follow the [write-adr task](./write-adr.md) in parallel.

Changes that require an ADR:

- New cross-protocol dependency
- Removal of an existing protocol capability
- Change to error taxonomy or error codes
- Change to offline queue limits or replay window

### 5. Verify

- [ ] Spec accurately describes the current implementation (cross-checked with source)
- [ ] All cross-protocol references are consistent
- [ ] No behavioral change was made without human approval
- [ ] ADR proposed if required

---

## After

If this spec update is part of a release:

- Reference the spec change in the PR description
- Add to release notes under the relevant protocol section

---

## Reference

- [write-adr.md](./write-adr.md)
- `_sop/2-docs/2-specs/protocol-index.md`
