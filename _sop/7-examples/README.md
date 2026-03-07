# Examples — gtcx-protocols

Runnable example integrations for each GTCX protocol.

## What Belongs Here

- Minimal working examples that demonstrate each protocol's integration surface
- Examples must be runnable without external dependencies (in-memory stubs are fine)
- One example per protocol at minimum; additional examples for advanced patterns

## Structure (Planned)

```
7-examples/
├── tradepass/     Credential issuance and verification
├── geotag/        Location capture and verification
├── gci/           Compliance score calculation
├── vaultmark/     Custody chain creation and transfer
├── pvp/           Escrow creation and settlement
└── panx/          Oracle submission and envelope signing
```

## What Does NOT Belong Here

- Full integration guides → `_sop/2-docs/6-gitbook/integration-guide.md`
- SDK reference → `_sop/2-docs/3-engineering/sdk-guide.md`
- Test fixtures → `protocols/<protocol>/src/__tests__/`

## References

- `_sop/2-docs/3-engineering/sdk-guide.md` — SDK usage patterns
- `_sop/2-docs/6-gitbook/quickstart.md` — entry-level quickstart
