# SDK Guide

TypeScript and Python SDKs for integrating with the GTCX Protocol stack. The SDKs expose all six protocols — TradePass, GeoTag, GCI, VaultMark, PvP, and PANX — behind a unified client interface.

---

## TypeScript SDK (`@gtcx/sdk`)

### Installation

```bash
pnpm add @gtcx/sdk
```

### Client Setup

```typescript
import { GTCXClient } from '@gtcx/sdk';

const client = new GTCXClient({
  apiUrl: 'https://api.testnet.gtcx.io',
  networkId: 'gtcx:testnet',
  chainId: 'gtcx-testnet-1',
  apiKey: process.env.GTCX_API_KEY,
  timeout: 30000, // optional, default 30s
});
```

### Networks

| Network | API URL                       | Purpose                 |
| ------- | ----------------------------- | ----------------------- |
| Testnet | `https://api.testnet.gtcx.io` | Development and testing |
| Ghana   | `https://api.ghana.gtcx.io`   | Ghana pilot network     |
| Mainnet | `https://api.gtcx.io`         | Production              |

---

### TradePass — Identity and Credentials

```typescript
// Resolve a DID
const credential = await client.tradepass.resolve('did:gtcx:tp_a1b2c3d4e5f67890');

// Verify a credential
const result = await client.tradepass.verify(credential);
console.log(`Valid: ${result.valid}`);

// Issue a new credential (requires issuer permissions)
const newCredential = await client.tradepass.issue({
  did: 'did:gtcx:tp_newproducer123456',
  name: 'Kwame Asante',
  role: 'PRODUCER_INDIVIDUAL',
  entityId: 'entity_gh_001',
  jurisdiction: 'GH',
});

// Revoke a credential
await client.tradepass.revoke('did:gtcx:tp_a1b2c3d4e5f67890', 'License expired');
```

---

### GCI — Compliance Scoring

```typescript
// Get current score
const score = await client.gci.getScore('entity_gh_001');
console.log(`Score: ${score.score}/100 (${score.tier})`);
// tier: 'PREMIUM' | 'VERIFIED' | 'PROVISIONAL' | 'BLOCKED'

// Get score history
const history = await client.gci.getHistory('entity_gh_001', 30); // last 30 days

// Get improvement suggestions
const suggestions = await client.gci.getSuggestions('entity_gh_001');

// Submit evidence for a factor
await client.gci.submitEvidence('entity_gh_001', 'documentation', [
  'https://storage.gtcx.io/licenses/gh-ml-2024-001234.pdf',
]);
```

---

### GeoTag — Location Verification

```typescript
// Submit a location claim
const claim = await client.geotag.submit({
  type: 'extraction',
  location: {
    latitude: 6.6885,
    longitude: -1.6244,
    accuracy: 5,
    timestamp: new Date().toISOString(),
    source: 'gps',
  },
  claimant: 'did:gtcx:tp_a1b2c3d4e5f67890',
  licenseId: 'GH-ML-2024-001234',
});

// Verify the claim
const verification = await client.geotag.verify(claim.id);
console.log(`Within boundary: ${verification.withinBoundary}`);
```

---

### VaultMark — Custody Chain

```typescript
// Get custody status
const custody = await client.vaultmark.getCustody('lot:gh-gold-20260115-001');

// Get full custody history
const history = await client.vaultmark.getHistory('lot:gh-gold-20260115-001');

// Transfer custody (dual-signature required)
const newCustody = await client.vaultmark.transfer(
  'lot:gh-gold-20260115-001',
  'did:gtcx:tp_vault0000abcdef12'
);

// Transfer with escrow conditions
const escrowCustody = await client.vaultmark.transfer(
  'lot:gh-gold-20260115-001',
  'did:gtcx:tp_buyer0000abcdef12',
  {
    escrow: true,
    releaseConditions: ['payment_confirmed', 'inspection_passed'],
  }
);

// Split a lot
const [lot1, lot2] = await client.vaultmark.split(
  'lot:gh-gold-20260115-001',
  [1.5, 1.0] // weight in kg
);

// Merge lots
const mergedLot = await client.vaultmark.merge([
  'lot:gh-gold-20260115-001',
  'lot:gh-gold-20260115-002',
]);
```

---

### PvP — Settlement

```typescript
// Create settlement
const settlement = await client.settlement.create({
  lotId: 'lot:gh-gold-20260115-001',
  buyer: 'did:gtcx:tp_buyer0000abcdef12',
  seller: 'did:gtcx:tp_a1b2c3d4e5f67890',
  amount: { value: 125000, currency: 'USD' },
  paymentMethod: 'escrow',
});

// Confirm payment (buyer side)
await client.settlement.confirmPayment(settlement.id, 'tx_proof_123');

// Confirm delivery (seller side)
await client.settlement.confirmDelivery(settlement.id, 'delivery_proof_456');

// Raise a dispute
await client.settlement.dispute(settlement.id, 'Weight mismatch — received 1.4kg, expected 1.5kg');
```

---

### Types and Schemas

All types are exported for compile-time safety:

```typescript
import type {
  TradePassCredential,
  TradePassDID,
  TradePassRole,
  GCIScore,
  GCITier,
  GCIFactor,
  GeoTagClaim,
  GeoLocation,
  CustodyRecord,
  CustodyEvent,
  Asset,
  Settlement,
} from '@gtcx/sdk';
```

Zod schemas are exported for runtime validation of external data:

```typescript
import { TradePassCredentialSchema, GCIScoreSchema, CustodyRecordSchema } from '@gtcx/sdk';

const result = TradePassCredentialSchema.safeParse(externalData);
if (result.success) {
  const credential = result.data; // fully typed
}
```

---

### Error Handling

```typescript
import { GTCXClient, GTCXError } from '@gtcx/sdk';

try {
  const credential = await client.tradepass.resolve('did:gtcx:tp_invalid');
} catch (error) {
  if (error instanceof GTCXError) {
    console.error(`[${error.code}] ${error.message}`);
    // error.status — HTTP status code
    // error.code   — machine-readable error code
  }
}
```

---

## Python SDK (`gtcx-sdk`)

### Installation

```bash
pip install gtcx-sdk
```

### Client Setup

The Python SDK is async-first, built on `httpx` with Pydantic models.

```python
import asyncio
from gtcx import GTCXClient

async def main():
    async with GTCXClient.from_network("testnet", api_key="your_key") as client:
        credential = await client.tradepass.resolve("did:gtcx:tp_a1b2c3d4e5f67890")
        result = await client.tradepass.verify(credential)
        print(f"Valid: {result.valid}")

asyncio.run(main())
```

Custom configuration:

```python
client = GTCXClient(
    api_url="https://api.testnet.gtcx.io",
    network_id="gtcx:testnet",
    chain_id="gtcx-testnet-1",
    api_key="...",
)
```

---

### TradePass

```python
# Resolve and verify
credential = await client.tradepass.resolve("did:gtcx:tp_a1b2c3d4e5f67890")
result = await client.tradepass.verify(credential)
print(f"Valid: {result.valid}, Issuer trusted: {result.issuer_trusted}")

# Issue new credential
from gtcx import TradePassSubject, TradePassRole

subject = TradePassSubject(
    did="did:gtcx:tp_newproducer123456",
    name="Kwame Asante",
    role=TradePassRole.PRODUCER_INDIVIDUAL,
    entity_id="entity_gh_001",
    jurisdiction="GH",
)
new_credential = await client.tradepass.issue(subject)
```

---

### GCI

```python
score = await client.gci.get_score("entity_gh_001")
print(f"Score: {score.score}/100 ({score.tier.value})")

for factor in score.factors:
    print(f"  {factor.name}: {factor.score}%")

suggestions = await client.gci.get_suggestions("entity_gh_001")
for s in suggestions:
    print(f"  {s.action} (+{s.potential_points} pts)")
```

---

### GeoTag

```python
from datetime import datetime

claim = await client.geotag.submit({
    "type": "extraction",
    "location": {
        "latitude": 6.6885,
        "longitude": -1.6244,
        "accuracy": 5,
        "timestamp": datetime.now().isoformat(),
        "source": "gps",
    },
    "claimant": "did:gtcx:tp_a1b2c3d4e5f67890",
    "licenseId": "GH-ML-2024-001234",
})

verification = await client.geotag.verify(claim.id)
print(f"Within boundary: {verification.within_boundary}")
```

---

### VaultMark

```python
custody = await client.vaultmark.get_custody("lot:gh-gold-20260115-001")
history = await client.vaultmark.get_history("lot:gh-gold-20260115-001")

# Transfer
new_custody = await client.vaultmark.transfer(
    "lot:gh-gold-20260115-001",
    to="did:gtcx:tp_vault0000abcdef12",
)

# Transfer with escrow
escrow_custody = await client.vaultmark.transfer(
    "lot:gh-gold-20260115-001",
    to="did:gtcx:tp_buyer0000abcdef12",
    escrow=True,
    release_conditions=["payment_confirmed", "inspection_passed"],
)
```

---

### Error Handling (Python)

```python
from gtcx import GTCXClient, GTCXError

try:
    credential = await client.tradepass.resolve("did:gtcx:tp_invalid")
except GTCXError as e:
    print(f"[{e.code}] {e}: HTTP {e.status}")
```

---

## Key Design Decisions

| Decision                                     | Rationale                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Zod validation on all responses (TypeScript) | Ensures SDK consumers never receive untyped data from external API calls      |
| Pydantic on all responses (Python)           | Same guarantee with Python type annotations                                   |
| Async-first in Python (`httpx`)              | Protocol operations involve network calls; blocking is inappropriate at scale |
| Tree-shakable TypeScript exports             | Consumers import only the protocols they use                                  |
| Zero dependencies beyond Zod/httpx+pydantic  | Minimizes supply chain surface and bundle size                                |

---

## Reference

- [code-standards.md](code-standards.md)
- [testing.md](testing.md)
- `protocols/*/SPEC.md`
