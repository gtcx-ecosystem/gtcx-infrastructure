---
title: 'Tamper-Evident Audit for AI Compliance — Open Source'
status: 'draft'
date: '2026-05-27'
owner: 'platform-engineering'
tier: 'standard'
tags: ['blog', 'launch', 'audit-signer', 'distribution']
review_cycle: 'on-change'
review_checklist:
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Tamper-Evident Audit for AI Compliance — Open Source

**TL;DR:** We published `@gtcx/audit-signer` on npm. It's the cryptographic substrate behind GTCX's compliance gateway — Ed25519-signed, hash-linked audit records that any third party can verify offline with no GTCX-side trust step. Zero runtime dependencies, MIT licensed, install with `npm install @gtcx/audit-signer`.

This post explains the problem, the design, and why we shipped it as a separate package instead of keeping it inside the product.

---

## The problem nobody named

Every regulated business has an "audit trail." Most of them are append-only logs. That's enough to stop you from _editing_ a single record — but it does nothing if the log file itself is replaced, truncated, replayed out of order, or quietly missing entries that should have happened.

When the auditor is the operator, that's fine. When the auditor is a regulator, a partner bank, or a future internal auditor reading evidence five years from now, "trust the operator" stops working. They need to verify what happened without trusting whoever is showing them the log.

That problem is becoming acute right now because of AI compliance. When a generative model makes a consequential decision — approving a KYC, clearing a transaction, attesting a credential — regulators are starting to ask "show me the audit trail, and prove it wasn't edited." Most teams answer with "we have process discipline." That's a story, not evidence.

We needed something we could hand to a third party and say: here's the chain, here's the public key, run this command, decide for yourself.

---

## The design

`@gtcx/audit-signer` is small on purpose. Three files in the source, zero runtime dependencies, six exported functions. The complete API:

```js
import {
  generateKeyPair,
  createRecord,
  signRecord,
  verifyRecord,
  createChain,
  append,
  verifyChain,
  toNdjson,
  fromNdjson,
} from '@gtcx/audit-signer';
```

A record looks like this:

```js
{
  id: 'a3f9c2…',                  // 16-byte random hex
  timestamp: '2026-05-22T00:00:00Z',
  actor: 'compliance-officer-42',
  action: 'credential.issue',
  target: 'did:zw:trader:abc',
  reason: 'export_permit',
  payloadHash: 'base64-sha256…',  // SHA-256 of the canonical payload
  prevHash: 'base64-sha256…',     // chain anchor to previous record
  signature: 'base64-ed25519…',
  publicKey: 'base64-spki…',      // embedded so verifiers don't need a keystore
}
```

Three design choices worth calling out:

### Ed25519, not RSA

Ed25519 produces 64-byte signatures, has deterministic output (no nonce-handling footguns), and is fast enough to sign in the request hot path. RSA-PSS would have worked, but you pay for it in signature size and key-handling complexity. Ed25519 is the right answer for new audit substrates today.

### SHA-256 over RFC 8785 (JCS)

JSON canonicalization is famously underspecified. RFC 8785 — JSON Canonicalization Scheme — pins exactly one bytes-on-the-wire representation per JSON object. Hash the canonicalized form, and the same record produces the same hash in any language with a JCS implementation. The hash chain works regardless of where the verifier runs.

### Public key embedded per record

Every signed record carries the public key that signed it. Yes, that's redundant when many records share a key — but it means a verifier doesn't need a keystore lookup. They just check `verifyChain(records)` and get a boolean. Key rotation is "the next record carries the new public key; prevHash still links." No magic, no key server.

---

## Quick start

```bash
npm install @gtcx/audit-signer
```

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

// Sign three records
const r1 = createRecord({
  actor: 'compliance-officer-42',
  action: 'credential.issue',
  target: 'did:zw:trader:abc',
  payload: { credentialType: 'export_permit' },
});
const s1 = append(chain, r1, privateKey, publicKey);

const r2 = createRecord({
  actor: 'compliance-officer-42',
  action: 'credential.verify',
  target: 'did:zw:trader:abc',
});
append(chain, r2, privateKey, publicKey);

const r3 = createRecord({
  actor: 'system',
  action: 'audit.checkpoint',
  target: chain.lastHash,
});
append(chain, r3, privateKey, publicKey);

// Persist
const ndjson = toNdjson(chain);
fs.writeFileSync('chain.ndjson', ndjson);

// Verify (could be a different process, machine, language)
const reloaded = fromNdjson(fs.readFileSync('chain.ndjson', 'utf-8'));
const { valid, firstInvalidIndex, reason } = verifyChain(reloaded);
console.log({ valid }); // true
```

A regulator's auditor with only the NDJSON file and a Node 20 runtime can verify the whole chain. They don't need anything from us.

---

## Why we shipped this as a separate package

GTCX runs a compliance gateway, an audit-flush sidecar, a dual-database substrate, and 23 other repos. We could have kept the signing code inside the gateway. We didn't, for three reasons:

1. **Other workflows need it.** Once you have tamper-evident records as a primitive, you stop being satisfied with append-only logs everywhere else. We use it in the audit-flush sidecar, in CI release evidence, and in a handful of governance workflows.

2. **External adoption is the test.** If `@gtcx/audit-signer` is genuinely useful outside GTCX, someone outside GTCX will adopt it. That's the empirical test of whether we've designed a primitive or just a library-shaped feature.

3. **Auditor verifiability.** The verifier in the package is the same verifier the auditor will run. There's no "trust our internal version vs the public version" gap.

---

## What's next

We're publishing two more substrates this quarter:

- **`terraform-aws-compliance-db`** — dual-database (operational + audit) module for regulated African fintech, with FATF-grade retention defaults and a per-jurisdiction plugin catalog. Already on GitHub at `github.com/amani-amina-anai/terraform-aws-compliance-db`; Terraform Registry listing pending.

- **`@gtcx/compliance-gateway-mcp`** — Model Context Protocol server exposing the gateway's read-only surface to AI agents. Discoverable, no mutating tools, deliberately not on npm yet because we want to harden the MCP boundary first.

Each piece is designed to compose with the others, but each works standalone. Pick the one that's load-bearing for your workflow today; we'll have more substrates ready by the time you need them.

---

## How to evaluate it

Three commands tell you whether `@gtcx/audit-signer` is real:

```bash
# 1. The published artifact exists
npm view @gtcx/audit-signer

# 2. It installs clean
mkdir test && cd test && npm init -y && npm install @gtcx/audit-signer

# 3. The verifier rejects tampering
node -e "
import('@gtcx/audit-signer').then(m => {
  const { privateKey, publicKey } = m.generateKeyPair();
  const chain = m.createChain();
  m.append(chain, m.createRecord({ actor: 'a', action: 'b', target: 'c' }), privateKey, publicKey);
  chain.records[0].target = 'TAMPERED';
  console.log(m.verifyChain(chain));
  // expected: { valid: false, firstInvalidIndex: 0, reason: 'signature failed' }
});
"
```

If the third command returns `valid: false`, the substrate is doing what it claims. If it returns `valid: true`, file a security advisory immediately — we want to know.

---

## License

MIT. Use it, fork it, ship it. If you find a cryptographic concern, please report via GitHub Security Advisories on `gtcx-ecosystem/gtcx-infrastructure` rather than a public issue.

If you build something on top of this, we'd love to hear about it. The substrate is more valuable when it's load-bearing for more than one organization.

---

_GTCX builds compliance substrate for AI-native regulated workflows. We're based in Cape Town, working on the Zimbabwe pilot, with substrate that's already running in production. The next post in this series will cover the dual-database pattern in `terraform-aws-compliance-db`._

---

**Internal review checklist (delete before publish):**

- [ ] Security Lead: cryptographic claims accurate (Ed25519, SHA-256+JCS, key handling)?
- [ ] Platform Eng Lead: every code snippet runs against npm-installed `@gtcx/audit-signer@0.1.0`?
- [ ] GTM Partner: positioning matches GTM narrative?
- [ ] Legal: MIT license confirmed; no PII in code examples
- [ ] Length: reading time ≤ 8 minutes
