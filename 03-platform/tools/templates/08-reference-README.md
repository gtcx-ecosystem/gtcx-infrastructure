# Reference

> **API documentation, schemas, and lookup resources**

## Contents

| Section                      | Description             |
| ---------------------------- | ----------------------- |
| [api/](./api/)               | API documentation       |
| [schemas/](./schemas/)       | Data model reference    |
| [glossary.md](./glossary.md) | Terminology definitions |

## Quick Links

### API Reference

- [OpenAPI Specification](../../gtcx-ecosystem-docs/api/openapi.yaml)
- [API README](../../gtcx-ecosystem-docs/api/README.md)

### Schemas

- [Data Models (Spec §7)](../../gtcx-ecosystem-docs/spec/07-data-models.md)
- [Schema Package](../../03-platform/packages/schemas/)

### Terminology

- [Full Glossary](../../gtcx-ecosystem-docs/GLOSSARY.md)
- [Spec-to-Code Map](../../gtcx-ecosystem-docs/SPEC-TO-CODE-MAP.md)

### Cryptographic

- [Test Vectors](../../gtcx-ecosystem-docs/TEST-VECTORS.md)
- [Security Spec (§8)](../../gtcx-ecosystem-docs/spec/08-security.md)

## Data Model Overview

```
03-platform/packages/schemas/src/
├── identity/           # TradePass™ schemas
├── compliance/         # GCI™ schemas
├── location/           # GeoTag™ schemas
├── custody/            # VaultMark™ schemas
├── settlement/         # PvP™ schemas
├── consensus/          # PANX™ schemas
├── events/             # Event sourcing
└── index.ts            # Public exports
```

All schemas use **Zod** for runtime validation and TypeScript type generation.

## Using Schemas

```typescript
import { TradePassDIDDocumentSchema, GCIInputSchema } from '@gtcx/schemas';

// Validate input
const result = GCIInputSchema.safeParse(input);
if (!result.success) {
  console.error(result.error);
}

// Type inference
type GCIInput = z.infer<typeof GCIInputSchema>;
```

## Related Documentation

- [Protocol Specification](../../gtcx-ecosystem-docs/spec/)
- [Engineering Standards](../05-engineering/)
- [Guides](../07-guides/)
