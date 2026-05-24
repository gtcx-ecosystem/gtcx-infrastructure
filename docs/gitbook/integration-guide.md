---
title: 'Integration Guide'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['crypto', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'monthly'
---

# Integration Guide

Full integration walkthrough for platform builders, exchange operators, and institutional participants connecting to the GTCX Protocol.

---

## Integration Patterns

Three primary integration patterns:

| Pattern                    | Who Uses It                    | What They Build                                          |
| -------------------------- | ------------------------------ | -------------------------------------------------------- |
| **Read integration**       | Buyers, auditors, government   | Verify provenance, read GCI scores, check custody status |
| **Write integration**      | Producers, custodians, traders | Create assets, transfer custody, submit attestations     |
| **Settlement integration** | Exchanges, trading platforms   | Create escrows, execute PvP settlements, handle disputes |

---

## Authentication

All API calls require a valid TradePass DID and API key. The DID establishes identity and role; the API key authenticates the client.

```typescript
import { GTCXClient } from '@gtcx/sdk';

const client = new GTCXClient({
  apiUrl: 'https://api.gtcx.io',
  networkId: 'gtcx:mainnet',
  chainId: 'gtcx-mainnet-1',
  apiKey: process.env.GTCX_API_KEY,
});
```

Operations are role-gated at the protocol boundary. Attempting an operation your credential's role does not permit returns a `UNAUTHORIZED` error.

---

## Read Integration

### Verify a Credential

```typescript
// Resolve and verify any operator's TradePass credential
const credential = await client.tradepass.resolve('did:gtcx:tp_a1b2c3d4e5f67890');
const result = await client.tradepass.verify(credential);

if (!result.valid) {
  // Credential is expired, suspended, or revoked — do not transact
}
```

### Read a GCI Score

```typescript
const score = await client.gci.getScore('entity_gh_001');

if (score.tier === 'BLOCKED') {
  // Operator has no market access — score below 50
}

if (score.tier === 'PREMIUM') {
  // Eligible for up to 22% price premium
}
```

### Verify Custody Chain

```typescript
// Full history — all transfers, events, and attestations
const history = await client.vaultmark.getHistory('lot:gh-gold-20260115-001');

// Current custody status
const custody = await client.vaultmark.getCustody('lot:gh-gold-20260115-001');
console.log(`Current custodian DID: ${custody.custodianDid}`);
console.log(`Last transferred: ${custody.lastTransferAt}`);
```

---

## Write Integration — Asset Lifecycle

### Register a New Asset (Producer)

Asset creation requires:

- A valid GeoTag credential as the origin anchor
- A Producer TradePass DID for the creating operator

```typescript
const asset = await client.vaultmark.createAsset({
  lotId: 'lot:gh-gold-20260115-001',
  commodity: 'gold',
  weight: { value: 2.5, unit: 'kg' },
  origin: {
    geoTagId: geoTagCredential.id, // Required — GeoTag origin anchor
    producer: 'did:gtcx:tp_a1b2c3d4e5f67890',
    extractedAt: new Date().toISOString(),
  },
});
```

### Transfer Custody

Transfers require dual-signature — both sender and receiver must sign:

```typescript
// Initiate transfer (sender)
const transfer = await client.vaultmark.transfer(
  'lot:gh-gold-20260115-001',
  'did:gtcx:tp_vault0000abcdef12' // Receiving custodian
);

// The receiving custodian must accept to complete the transfer
// Dual-signature is enforced at the protocol level
```

### Split and Merge Lots

```typescript
// Split one lot into two
const [lot1, lot2] = await client.vaultmark.split(
  'lot:gh-gold-20260115-001',
  [1.5, 1.0] // weights in kg — must sum to original weight
);

// Merge multiple lots into one
const merged = await client.vaultmark.merge([
  'lot:gh-gold-20260115-001',
  'lot:gh-gold-20260115-002',
]);
```

---

## Settlement Integration

### Create an Escrow

Buyers create escrow with conditions. The minimum GCI score gate is configurable:

```typescript
const settlement = await client.settlement.create({
  lotId: 'lot:gh-gold-20260115-001',
  buyer: 'did:gtcx:tp_buyer0000abcdef12',
  seller: 'did:gtcx:tp_a1b2c3d4e5f67890',
  amount: { value: 125000, currency: 'USD' },
  paymentMethod: 'escrow',
  conditions: {
    minGciScore: 70, // Configurable per transaction; default: 50
  },
});
```

### Execute Settlement

Both parties confirm. PANX consensus is triggered automatically and must reach 2/3 quorum before funds are released:

```typescript
// Buyer confirms payment
await client.settlement.confirmPayment(settlement.id, paymentProofId);

// Seller confirms delivery
await client.settlement.confirmDelivery(settlement.id, deliveryProofId);

// Settlement is now pending PANX consensus — both legs execute atomically
```

### Handle Disputes

```typescript
await client.settlement.dispute(
  settlement.id,
  'Weight discrepancy — received 2.3kg, expected 2.5kg'
);

// Dispute resolution timeline:
// - Automatic:  24 hours
// - Mediation:  72 hours
// - Arbitration: 7 days
```

---

## Offline Handling

The GTCX SDK supports offline operation for field deployments. Operations queue locally and replay when connectivity returns:

```typescript
// Configure offline queue (TypeScript SDK)
const client = new GTCXClient({
  apiUrl: 'https://api.gtcx.io',
  networkId: 'gtcx:mainnet',
  chainId: 'gtcx-mainnet-1',
  apiKey: process.env.GTCX_API_KEY,
  offline: {
    enabled: true,
    maxQueueSize: 500, // VaultMark: up to 500 transfers
    syncOnReconnect: true,
  },
});
```

**Offline limits per protocol:**

| Protocol  | Max Offline                  | Queue          |
| --------- | ---------------------------- | -------------- |
| TradePass | 45 days (cached credentials) | N/A            |
| GeoTag    | 30 days                      | 1,000 captures |
| GCI       | 30 days (cached scores)      | N/A            |
| VaultMark | 30 days                      | 500 transfers  |
| PvP       | Requires network             | Queue only     |

---

## Error Reference

| Error Code                 | Meaning                                             | Action                       |
| -------------------------- | --------------------------------------------------- | ---------------------------- |
| `INVALID_ARGUMENT`         | Malformed input — schema validation failed          | Fix the input                |
| `UNAUTHORIZED`             | Operation not permitted for your credential role    | Check role permissions       |
| `SIGNATURE_INVALID`        | Ed25519 signature verification failed               | Re-sign or re-authenticate   |
| `REPLAY_DETECTED`          | Duplicate message ID within the replay window       | Use a new message ID         |
| `RATE_LIMITED`             | Request rate exceeded                               | Back off and retry           |
| `NOT_FOUND`                | DID, lot, or settlement not found                   | Verify the identifier        |
| `STATE_TRANSITION_INVALID` | Operation not valid in the resource's current state | Check the resource lifecycle |
| `EXPIRED`                  | Credential or escrow has expired                    | Renew or create a new one    |

---

## Testing

Use the testnet for all integration development:

```typescript
const client = new GTCXClient({
  apiUrl: 'https://api.testnet.gtcx.io',
  networkId: 'gtcx:testnet',
  chainId: 'gtcx-testnet-1',
  apiKey: process.env.GTCX_TESTNET_API_KEY,
});
```

Testnet credentials, lots, and settlements are fully functional but do not involve real assets or payments.

---

## Reference

- [quickstart.md](quickstart.md)
- sdk-guide.md (`./3-engineering/sdk-guide.md`)
- protocol-index.md (`./2-specs/protocol-index.md`)
