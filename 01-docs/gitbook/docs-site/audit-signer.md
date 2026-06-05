---
title: '@gtcx/audit-signer — Tamper-Evident Audit Records'
status: 'draft'
date: '2026-05-27'
owner: 'platform-engineering'
tier: 'standard'
tags: ['docs-site', 'audit-signer', 'reference']
review_cycle: 'on-change'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# `@gtcx/audit-signer`

Ed25519-signed, hash-linked audit records for AI compliance workflows. Tamper-evident. Third-party verifiable. Zero runtime dependencies.

## Why

Append-only logs prevent edits to individual records. They do nothing against log replacement, truncation, replay, or quiet omission. When the auditor is not the operator — regulator, partner bank, future internal auditor — append-only is not enough.

`@gtcx/audit-signer` provides cryptographic evidence that:

1. A specific record existed
2. It was signed by a specific key
3. It chains to the previous record in deterministic, replay-detectable order
4. No record can be inserted, removed, or modified without detection

A third party with only the NDJSON file can verify all of the above offline.

## Install

```bash
npm install @gtcx/audit-signer
# or
pnpm add @gtcx/audit-signer
```

Requires Node ≥ 20.

## Quick start

```js
import {
  generateKeyPair,
  createChain,
  createRecord,
  append,
  verifyChain,
  toNdjson,
  fromNdjson,
} from '@gtcx/audit-signer';

const { privateKey, publicKey } = generateKeyPair();
const chain = createChain();

const record = createRecord({
  actor: 'compliance-officer-42',
  action: 'credential.issue',
  target: 'did:zw:trader:abc',
  payload: { credentialType: 'export_permit' },
});

const signed = append(chain, record, privateKey, publicKey);

// Persist
const ndjson = toNdjson(chain);

// Verify (could be different process / machine / language with JCS)
const reloaded = fromNdjson(ndjson);
const { valid, firstInvalidIndex, reason } = verifyChain(reloaded);
console.log(valid); // true
```

## Record shape

```ts
type SignedAuditRecord = {
  id: string; // 16-byte random hex
  timestamp: string; // ISO-8601 UTC
  actor: string; // who initiated the consequential action
  action: string; // namespaced verb, e.g. "credential.issue"
  target: string; // what the action acted on
  reason?: string; // optional human-readable cause
  payloadHash?: string; // base64 SHA-256 of the canonical payload
  prevHash?: string; // base64 SHA-256 of the previous canonical form
  signature: string; // base64 Ed25519 signature
  publicKey: string; // base64 SPKI public key (per-record)
};
```

The `payload` is hashed at sign time and the original is **not** kept in the record. If you need the payload for downstream consumption, transport it alongside the record on your wire format and verify the `payloadHash` matches.

## API reference

### `generateKeyPair()`

Returns `{ publicKey: KeyObject, privateKey: KeyObject }` — Ed25519, generated via Node's `crypto.generateKeyPairSync`.

### `createRecord({ actor, action, target, reason?, payload?, prevHash?, now? })`

Builds an unsigned record. Throws if `actor`, `action`, or `target` is missing. Auto-generates `id` and `timestamp`. If `payload` is provided, computes `payloadHash` via SHA-256 over the JSON-stringified payload.

### `signRecord(record, privateKey, publicKey)`

Signs a single record. Returns a `SignedAuditRecord` with `signature` and `publicKey` fields populated.

### `verifyRecord(record)`

Returns `true` if the record's signature validates against its embedded `publicKey`. Returns `false` on any verification failure (signature mismatch, malformed key, etc.). Does NOT throw.

### `createChain()`

Returns `{ records: [], lastHash: '' }`.

### `append(chain, record, privateKey, publicKey)`

Signs the record with `prevHash` set to the canonical hash of the previous record (or empty for genesis), appends to `chain.records`, advances `chain.lastHash`, and returns the signed record.

### `verifyChain(chain)`

Returns `{ valid: boolean, firstInvalidIndex: number, reason: string }`. The chain is valid if every record's signature is valid AND every `prevHash` matches the previous record's canonical hash. `firstInvalidIndex` is `-1` on success or the index of the first failure.

### `toNdjson(chain)` / `fromNdjson(string)`

Stable serialization for durable storage. One record per line, newline-delimited.

## Failure modes

| Failure                                   | What verifyChain returns                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Record's `target` modified                | `valid: false`, `firstInvalidIndex` at the tampered record, `reason: 'signature failed'` |
| Record inserted                           | `valid: false` at the insertion point, `reason: 'prevHash mismatch'`                     |
| Record removed                            | `valid: false` at the gap, `reason: 'prevHash mismatch'`                                 |
| `prevHash` modified                       | Same as above                                                                            |
| `signature` modified                      | `valid: false`, `reason: 'signature failed'`                                             |
| `publicKey` swapped                       | `valid: false`, `reason: 'signature failed'`                                             |
| Genuine new record signed by the same key | `valid: true`                                                                            |

## Design choices

### Ed25519, not RSA

Deterministic signatures, 64-byte output, no nonce-handling footguns, fast enough for hot-path signing. RSA-PSS would also be sound; Ed25519 wins on signature size and key handling.

### SHA-256 over RFC 8785 (JCS)

JSON canonicalization is famously underspecified. RFC 8785 pins exactly one bytes-on-the-wire representation. A verifier in any language with a JCS implementation produces the same hash.

### Public key embedded per record

A verifier with only the NDJSON has everything. No keystore lookup, no key server, no PKI ceremony. Key rotation is "the next record carries the new public key; `prevHash` still links."

## When NOT to use this

- High-throughput, low-value telemetry — use a log pipeline.
- Anything that doesn't need third-party verifiability — you'll pay the signing cost for no benefit.
- Cryptographic primitives below this library (key custody, KMS integration, HSM bindings) — those are upstream concerns.

## Compliance posture

`@gtcx/audit-signer` is the substrate behind GTCX's SIGNAL Supervision S2 (audit trail) and Integrity I2 (audit immutability) controls. The published SIGNAL scorecard for `gtcx-infrastructure` currently scores 9.60/10 with cryptographic evidence pointers that resolve to live, externally verifiable artifacts.

## Source

- npm: https://www.npmjs.com/package/@gtcx/audit-signer
- GitHub: https://github.com/gtcx-ecosystem/gtcx-infrastructure/tree/main/03-platform/tools/audit-signer

## License

MIT.
