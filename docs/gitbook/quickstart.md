---
title: 'Quickstart'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['crypto', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'monthly'
---

# Quickstart

Get up and running with the GTCX Protocol SDK in under 10 minutes.

---

## What You Are Building

GTCX Protocol provides six sovereign verification protocols for commodity supply chains:

| Protocol      | What It Does                                                               |
| ------------- | -------------------------------------------------------------------------- |
| **TradePass** | Verified identity and role credentials for every supply chain participant  |
| **GeoTag**    | Cryptographic proof of extraction location, bound to a licensed area       |
| **GCI**       | Continuous compliance score (0–100) gating market access                   |
| **VaultMark** | Tamper-evident chain of custody from extraction to buyer                   |
| **PvP**       | Atomic settlement — custody and payment complete together, or neither does |
| **PANX**      | Multi-party consensus for price data and settlement validation             |

---

## Prerequisites

- Node.js ≥ 20 or Python ≥ 3.11
- A GTCX testnet API key (contact your integration partner)

---

## TypeScript — Installation and Setup

```bash
pnpm add @gtcx/sdk
# or
npm install @gtcx/sdk
```

```typescript
import { GTCXClient } from '@gtcx/sdk';

const client = new GTCXClient({
  apiUrl: 'https://api.testnet.gtcx.io',
  networkId: 'gtcx:testnet',
  chainId: 'gtcx-testnet-1',
  apiKey: process.env.GTCX_API_KEY,
});
```

---

## Python — Installation and Setup

```bash
pip install gtcx-sdk
```

```python
from gtcx import GTCXClient

async with GTCXClient.from_network("testnet", api_key="your_key") as client:
    ...
```

---

## Core Flow: Producer to Buyer

The primary GTCX flow — verified extraction, custody chain, and atomic settlement:

```
1. Producer registers → TradePass DID issued
2. Producer captures extraction location → GeoTag credential created
3. Asset registered → VaultMark lot created (references GeoTag as origin)
4. GCI score computed for producer (must be ≥ 50 for market access)
5. Custody transferred through supply chain → each transfer recorded on VaultMark
6. Buyer creates PvP escrow with funds locked
7. PANX validators attest to settlement (2/3 quorum required)
8. Settlement executes — custody to buyer, payment to seller — atomically
```

---

## Step 1 — Resolve a TradePass Identity

```typescript
// TypeScript
const credential = await client.tradepass.resolve('did:gtcx:tp_a1b2c3d4e5f67890');
const result = await client.tradepass.verify(credential);
console.log(`Valid: ${result.valid}, Role: ${credential.credentialSubject.role}`);
```

```python
# Python
credential = await client.tradepass.resolve("did:gtcx:tp_a1b2c3d4e5f67890")
result = await client.tradepass.verify(credential)
print(f"Valid: {result.valid}")
```

---

## Step 2 — Check a GCI Score

```typescript
const score = await client.gci.getScore('entity_gh_001');
console.log(`Score: ${score.score}/100 — ${score.tier}`);
// tier: 'PREMIUM' | 'VERIFIED' | 'PROVISIONAL' | 'BLOCKED'
```

```python
score = await client.gci.get_score("entity_gh_001")
print(f"Score: {score.score}/100 ({score.tier.value})")
```

---

## Step 3 — Verify a Custody Chain

```typescript
const history = await client.vaultmark.getHistory('lot:gh-gold-20260115-001');
console.log(`${history.length} custody events on record`);

const current = await client.vaultmark.getCustody('lot:gh-gold-20260115-001');
console.log(`Current custodian: ${current.custodianDid}`);
```

---

## Step 4 — Execute a Settlement

```typescript
// Buyer creates escrow
const settlement = await client.settlement.create({
  lotId: 'lot:gh-gold-20260115-001',
  buyer: 'did:gtcx:tp_buyer0000abcdef12',
  seller: 'did:gtcx:tp_a1b2c3d4e5f67890',
  amount: { value: 125000, currency: 'USD' },
  paymentMethod: 'escrow',
});

// Both parties confirm — PANX consensus triggered automatically
await client.settlement.confirmPayment(settlement.id, 'tx_proof_123');
await client.settlement.confirmDelivery(settlement.id, 'delivery_proof_456');
```

---

## Error Handling

```typescript
import { GTCXClient, GTCXError } from '@gtcx/sdk';

try {
  const credential = await client.tradepass.resolve('did:gtcx:tp_invalid');
} catch (error) {
  if (error instanceof GTCXError) {
    console.error(`[${error.code}] ${error.message}`);
  }
}
```

---

## Networks

| Network | API URL                       | Purpose                             |
| ------- | ----------------------------- | ----------------------------------- |
| Testnet | `https://api.testnet.gtcx.io` | Development and integration testing |
| Mainnet | `https://api.gtcx.io`         | Production                          |

---

## Next Steps

- [integration-guide.md](integration-guide.md) — Full walkthrough with authentication, offline handling, and webhook setup
- [governance.md](governance.md) — Becoming a validator or government participant
- Protocol dependency maps and integration contracts are maintained in the protocol and product repos.
- SDK reference material is maintained in the service and protocol repos.
