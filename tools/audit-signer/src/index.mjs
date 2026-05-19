/**
 * @gtcx/audit-signer — Cryptographic audit record signing for consequential AI flows.
 *
 * Provides Ed25519 signing, hash-linked chains, and tamper detection
 * for audit records produced by AI agents and automated systems.
 */

export {
  generateKeyPair,
  canonicalize,
  hashCanonical,
  signRecord,
  verifyRecord,
  createRecord,
} from './signer.mjs';

export {
  createChain,
  append,
  verifyChain,
  toNdjson,
  fromNdjson,
} from './chain.mjs';
