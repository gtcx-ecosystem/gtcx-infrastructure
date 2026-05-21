# @gtcx/audit-signer

Ed25519-signed, hash-linked audit chain for AI compliance flows. Zero runtime dependencies. Records are tamper-evident; any auditor with the per-record public key can confirm authenticity offline.

## Why this exists

Most "audit trails" are append-only logs. That stops you from _editing_ a record but it does nothing if the log file itself is replaced, truncated, or replayed out of order. Regulators are starting to require cryptographic evidence — not just process discipline.

`@gtcx/audit-signer` is what we built when we needed to ship that evidence under SIGNAL S2 supervision claims. It's the substrate behind GTCX's compliance gateway, but the API is generic — any consequential workflow can use it.

## Install

```bash
npm install @gtcx/audit-signer
# or
pnpm add @gtcx/audit-signer
```

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

const r1 = createRecord({
  actor: 'compliance-officer-42',
  action: 'credential.issue',
  target: 'did:zw:trader:abc',
  payload: { credentialType: 'export_permit' },
});
const signed = append(chain, r1, privateKey, publicKey);

console.log(signed.signature); // base64 Ed25519 signature
console.log(signed.publicKey); // base64 SPKI public key for this record
console.log(signed.prevHash); // chain-anchor hash from the previous record

// Persist by exporting NDJSON; verify later with no prior context.
const ndjson = toNdjson(chain);
const reloaded = fromNdjson(ndjson);
const { valid, firstInvalidIndex } = verifyChain(reloaded);
console.log(valid); // true
```

## What's in the box

| Function                                                     | Purpose                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `generateKeyPair()`                                          | Ed25519 keypair (sodium-grade randomness via Node `crypto`).                                                 |
| `createRecord({ actor, action, target, reason?, payload? })` | Build an unsigned record. Canonicalizes via [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785).              |
| `signRecord(record, privateKey, publicKey)`                  | Sign a single record.                                                                                        |
| `verifyRecord(signed)`                                       | Verify a single record's signature against its embedded public key.                                          |
| `createChain()`                                              | New empty chain.                                                                                             |
| `append(chain, record, privateKey, publicKey)`               | Sign + append + advance the chain head.                                                                      |
| `verifyChain(chain)`                                         | Verifies every record's signature AND every `prevHash` link. Returns `{ valid, firstInvalidIndex, reason }`. |
| `toNdjson(chain)` / `fromNdjson(s)`                          | Stable serialization for durable storage.                                                                    |

## Record shape

```ts
type SignedAuditRecord = {
  id: string; // 16-byte hex
  timestamp: string; // ISO-8601 UTC
  actor: string; // who initiated the consequential action
  action: string; // namespaced verb, e.g. "credential.issue"
  target: string; // what the action acted on
  reason?: string; // optional human-readable cause
  payload?: unknown; // optional structured payload (canonicalized)
  payloadHash: string; // base64 SHA-256 of the canonical payload
  prevHash: string; // base64 SHA-256 of the previous record's canonical form (empty for genesis)
  signature: string; // base64 Ed25519 signature
  publicKey: string; // base64 SPKI public key (lets verifiers work without a keystore)
};
```

The `publicKey` ships in every record on purpose: a third party can verify the chain with nothing but the NDJSON and `verifyChain()`. No "trust the key server" step.

## Design choices

- **Ed25519, not RSA.** Deterministic signatures, no nonce-handling footguns, 64-byte sigs, fast.
- **SHA-256 over RFC 8785 JCS.** JSON canonicalization is well-specified, audit-friendly, and the same hash works in any language with a JCS implementation.
- **Public key embedded per-record.** Key rotation is just "next record carries the new public key, prevHash still links." No magic.
- **No external storage.** This module produces records. Putting them in S3 Object Lock, JetStream, Postgres, or a printout is your call. We use NATS JetStream → S3 Object Lock (`COMPLIANCE` mode, 2557-day retention) in GTCX.

## When to reach for this

- AI workflows where you need to prove that a specific decision happened, with what input, in what order.
- Regulated industries that ask "how do we know your log wasn't edited?"
- Cross-organization workflows where the auditor isn't the operator.
- Anywhere "powered by Stripe" levels of trust matter — and you want to own it instead of renting it.

## When NOT to reach for this

- High-throughput, low-value telemetry. Use a log pipeline.
- Anything that doesn't need third-party verifiability. Don't pay the signing cost for a metric.

## Compliance posture

The records produced here are already used in GTCX's SIGNAL 9.29 audit posture under metrics S2 (audit trail), I2 (audit immutability), and I3 (tamper-evident release). See the GTCX [score evidence ledger](https://github.com/gtcx-ecosystem/gtcx-infrastructure/blob/main/docs/audit/score-evidence-ledger.json) for live links to deployed evidence.

## License

MIT. Use it, fork it, ship it. If you find a bug in the signing path, please report it via GitHub Security Advisories.
