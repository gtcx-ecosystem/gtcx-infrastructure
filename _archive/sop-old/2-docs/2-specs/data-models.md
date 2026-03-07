# Data Models

Shared schemas, cross-protocol types, and schema conventions used across the GTCX Protocol layer. All schemas are implemented in `@gtcx/schemas` using Zod for runtime validation.

---

## 1. Design Principles

| Principle                  | Implementation                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **Type safety first**      | Every external input validated with Zod at runtime. Zero `any` types in production code. |
| **Commodity agnostic**     | Zero hardcoded commodity references. All asset types defined via configuration.          |
| **Evolution ready**        | All schemas versioned semantically. Migration paths defined for all breaking changes.    |
| **Documentation embedded** | JSDoc on all public types. Examples included in schemas.                                 |

---

## 2. Package Structure

```
@gtcx/schemas/
├── core/
│   ├── primitives.ts      # Base types: DID, UUID, DateTime, Hash, Signature
│   ├── common.ts          # Shared types: Coordinates, Money, Weight, Address
│   └── errors.ts          # Error schemas
│
├── identity/              # TradePass™ schemas
│   ├── did.ts             # DID documents, verification methods
│   ├── credentials.ts     # Verifiable credentials, proofs
│   ├── biometrics.ts      # Biometric templates
│   └── roles.ts           # Role definitions, operator types
│
├── assets/                # VaultMark™ schemas
│   ├── registry.ts        # Asset type registry
│   ├── identity.ts        # Asset identity, lot IDs
│   ├── custody.ts         # Custody chain, transfer events
│   └── verification.ts    # Verification records
│
├── compliance/            # GCI™ schemas
│   ├── scoring.ts         # Score calculations, factor weights
│   ├── factors.ts         # Factor definitions per category
│   └── appeals.ts         # Appeal process
│
├── location/              # GeoTag™ schemas
│   ├── capture.ts         # Location capture, multi-source proof
│   ├── credentials.ts     # Location credentials
│   └── anomalies.ts       # Anomaly detection results
│
├── settlement/            # PvP™ schemas
│   ├── escrow.ts          # Escrow records, state machine
│   ├── payment.ts         # Payment methods, multi-currency
│   └── disputes.ts        # Dispute resolution
│
├── consensus/             # PANX™ schemas
│   ├── requests.ts        # Consensus requests
│   ├── votes.ts           # Validator votes
│   └── results.ts         # Consensus results, attestations
│
├── config/
│   ├── commodities/       # gold.ts, coffee.ts, cobalt.ts, timber.ts
│   └── jurisdictions/     # Per-jurisdiction regulatory mappings
│
├── migrations/
│   ├── registry.ts        # Version registry
│   └── executor.ts        # Migration executor
│
└── index.ts               # Public exports
```

### Import Convention

```typescript
// Standard: import from package root
import { AssetIdentitySchema, TradePassDIDDocumentSchema, GCIOutputSchema } from '@gtcx/schemas';

// Advanced: import specific subpackage
import { AssetRegistry } from '@gtcx/schemas/assets';
import { MigrationExecutor } from '@gtcx/schemas/migrations';

// Never: do not import from internal paths
// import { ... } from '@gtcx/schemas/core/primitives';  ❌
```

---

## 3. Core Primitives

### 3.1 DID Types

```typescript
// GTCX DID format: did:gtcx:<type>_<hash>
const GTCXDIDSchema = z.string().regex(/^did:gtcx:[a-z]{2}_[a-f0-9]{16,32}$/);

// DID type prefixes
const DIDTypeSchema = z.enum([
  'tp', // TradePass (identity)
  'va', // Validator
  'as', // Asset
  'es', // Escrow
  'cr', // Credential
  'gt', // GeoTag
  'vm', // VaultMark
  'node', // Network node
]);
```

Examples:

- `did:gtcx:tp_a1b2c3d4e5f67890` — TradePass identity
- `did:gtcx:va_9876543210fedcba` — Validator node
- `did:gtcx:node_abcd1234ef567890` — Network node

### 3.2 Cryptographic Types

```typescript
// Ed25519 signature (base64url, 88 chars)
const SignatureSchema = z.string().regex(/^[A-Za-z0-9+/]{86}==$/);

// SHA-256 hash with prefix
const SHA256HashSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

// Multibase-encoded public key (Ed25519)
const PublicKeyMultibaseSchema = z.string().regex(/^z[1-9A-HJ-NP-Za-km-z]+$/);
```

### 3.3 Temporal Types

```typescript
// ISO 8601 datetime with timezone (required)
const DateTimeSchema = z.string().datetime({ offset: true });
// Example: "2026-03-15T14:30:00.000Z"

// ISO 8601 date only
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
// Example: "2026-03-15"

// Semantic version
const SemVerSchema = z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/);
```

### 3.4 Geographic Types

```typescript
// WGS84 coordinates
const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(), // meters above sea level
  accuracy: z.number().positive().optional(), // horizontal accuracy in meters
});

// Geohash for spatial indexing (precision 1-12)
const GeohashSchema = z.string().regex(/^[0-9b-hjkmnp-z]{1,12}$/);
```

### 3.5 Financial Types

```typescript
// Monetary amount with currency
const MoneySchema = z.object({
  value: z.number().nonnegative(),
  currency: z.string().length(3).toUpperCase(), // ISO 4217
  precision: z.number().int().min(0).max(8).default(2),
});

// Weight measurement
const WeightSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['g', 'kg', 'oz', 'lb', 'mt']),
});
```

---

## 4. Cross-Protocol Shared Types

### 4.1 Audit Event (all protocols)

Every state change across all protocols emits an audit event. Events are hash-chained for tamper resistance.

```typescript
const AuditEventSchema = z.object({
  eventId: z.string().uuid(),
  sequence: z.number().int().positive(), // Monotonically increasing per source
  source: z.string(), // Protocol + component identifier
  action: z.string(), // What happened
  actor: GTCXDIDSchema, // Who did it
  targetId: z.string().optional(), // What it happened to
  timestamp: DateTimeSchema,
  data: z.record(z.string(), z.unknown()), // Event payload
  prevHash: SHA256HashSchema.optional(), // Hash of previous event (chain)
  hash: SHA256HashSchema, // SHA-256(prevHash + eventId + data)
  signature: SignatureSchema, // Ed25519 signature by actor
});
```

### 4.2 Pagination (all list endpoints)

```typescript
const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  cursor: z.string().optional(),
});

const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    hasMore: z.boolean(),
    nextCursor: z.string().optional(),
  });
```

### 4.3 Evidence Reference (GeoTag, VaultMark, PvP)

```typescript
const EvidenceSchema = z.object({
  type: z.enum(['photo', 'document', 'sensor_reading', 'signature', 'witness']),
  reference: z.string(), // URI or storage key
  hash: SHA256HashSchema, // Content hash for integrity
  capturedAt: DateTimeSchema,
  capturedBy: GTCXDIDSchema,
});
```

---

## 5. Asset Identification

### 5.1 Lot ID Format

```
lot:{country_code}-{commodity}-{yyyymmdd}-{sequence}

Examples:
  lot:gh-gold-20260115-001
  lot:cd-cobalt-20260203-042
  lot:rw-coffee-20260110-007
  lot:tz-timber-20260301-015
```

### 5.2 Asset Type Registry

Asset types are registered in `@gtcx/schemas/config/commodities/`. Each entry defines measurement units, verification requirements, GCI weight calibration, and regulatory mappings. Adding a new commodity requires only a new configuration file — no code changes.

| Commodity | Primary Unit | Required Verifications               | Regulatory Frameworks              |
| --------- | ------------ | ------------------------------------ | ---------------------------------- |
| Gold      | grams        | assay, provenance, custody           | EU_CSDDD, OECD_DDG, DoddFrank_1502 |
| Coffee    | kg           | quality_grade, cupping_score, weight | ISO 9001, UTZ, RFA                 |
| Cobalt    | kg           | purity, esg, child_labor_check       | EU_CSDDD, OECD_DDG                 |
| Timber    | m³           | chain_of_custody, species, legal     | EUTR, FLEGT, FSC                   |

---

## 6. Schema Versioning

### 6.1 Versioning Policy

All schemas use semantic versioning (`MAJOR.MINOR.PATCH`):

| Change Type        | Version Bump | Backward Compatible?    |
| ------------------ | ------------ | ----------------------- |
| Add optional field | MINOR        | Yes                     |
| Add required field | MAJOR        | No — migration required |
| Remove field       | MAJOR        | No — migration required |
| Rename field       | MAJOR        | No — migration required |
| Tighten validation | PATCH        | Usually yes             |

### 6.2 Migration Pattern

Breaking schema changes ship with a migration function in `@gtcx/schemas/migrations/`:

```typescript
// migrations/versions/tradepass-v2-to-v3.ts
export const migration: SchemaMigration = {
  from: '2.x.x',
  to: '3.0.0',
  up: (v2Data) => ({ ...v2Data, newField: deriveFromV2(v2Data) }),
  down: (v3Data) => omit(v3Data, 'newField'),
};
```

The `MigrationExecutor` runs migrations in order during sync when a device running an older schema version reconnects to a server running a newer schema.

---

## Reference

- [protocol-index.md](protocol-index.md)
- [operator-types.md](operator-types.md)
- `protocols/*/SPEC.md` — individual protocol schemas
