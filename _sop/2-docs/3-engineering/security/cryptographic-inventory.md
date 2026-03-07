# Cryptographic Inventory

All cryptographic operations across the GTCX Protocol monorepo. Scope: all six protocols and all shared packages (`@gtcx/crypto`, `@gtcx/schemas`, `@gtcx/validators`, `@gtcx/types`, `@gtcx/domain`).

---

## Algorithm Summary

| Algorithm   | Use                                                                    | FIPS 140-2 Status          |
| ----------- | ---------------------------------------------------------------------- | -------------------------- |
| Ed25519     | Signing and verification (credentials, envelopes, custody, settlement) | Approved (NIST SP 800-186) |
| AES-256-GCM | Payload encryption and decryption                                      | Approved (NIST SP 800-38D) |
| SHA-256     | Hashing (event chains, content integrity)                              | Approved (FIPS 180-4)      |

No unapproved or deprecated algorithms are in use. `x25519` is declared in `CryptoAlgorithm` union type but has no implementation — reserved for future key agreement.

---

## 1. Signing — Ed25519

All digital signatures use Ed25519 (256-bit, 32-byte keys).

| Usage                                             | Protocol     | Source File                                       |
| ------------------------------------------------- | ------------ | ------------------------------------------------- |
| Credential proof signing (`Ed25519Signature2020`) | TradePass    | `protocols/tradepass/src/credentials.ts:51-61`    |
| Credential signature verification                 | TradePass    | `protocols/tradepass/src/verification.ts:120-159` |
| Message envelope signing                          | PANX         | `protocols/panx/src/envelope.ts:201-217`          |
| Message envelope verification                     | PANX         | `protocols/panx/src/envelope.ts:219-236`          |
| Oracle price submission verification              | PANX         | `protocols/panx/src/oracle.ts:203-209`            |
| Settlement lock commitment verification           | PvP          | `protocols/pvp/src/settlement.ts:132-153`         |
| Custody challenge witness verification            | VaultMark    | `protocols/vaultmark/src/custody.ts:204-228`      |
| Generic sign/verify (CryptoProvider interface)    | @gtcx/crypto | `packages/crypto/index.ts:40-48`                  |

Verification uses `@gtcx/crypto verifySignature()` throughout. The `CryptoProvider` interface (`packages/crypto/index.ts:32-37`) is the single abstraction point for all crypto operations.

---

## 2. Encryption — AES-256-GCM

| Usage              | Source File                      | Notes                                                                        |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------- |
| Payload encryption | `packages/crypto/index.ts:49-61` | 12-byte random IV (`randomBytes(12)`); produces authentication tag           |
| Payload decryption | `packages/crypto/index.ts:62-76` | Requires `authTag`; validates IV length (12 bytes) and key length (32 bytes) |

---

## 3. Hashing — SHA-256

| Usage                       | Source File                                  | Notes                                               |
| --------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Generic hash utility        | `packages/crypto/index.ts:123-127`           | `sha256()` using `node:crypto createHash('sha256')` |
| Custody event chain hashing | `protocols/vaultmark/src/custody.ts:293-310` | Output format: `sha256:{hex_digest}`                |
| Audit event hash chaining   | All protocols                                | Each event hashes `prevHash + eventId + data`       |

---

## 4. Key Formats

| Format          | Usage                                            | Source File                            |
| --------------- | ------------------------------------------------ | -------------------------------------- |
| PEM (PKCS8)     | Private key import for Ed25519 signing           | `packages/crypto/index.ts:89-98`       |
| DER (PKCS8)     | Private key binary fallback                      | `packages/crypto/index.ts:93`          |
| PEM (SPKI)      | Public key import for verification               | `packages/crypto/index.ts:100-109`     |
| DER (SPKI)      | Public key binary fallback                       | `packages/crypto/index.ts:104`         |
| Base64 DER/SPKI | Public key transport in oracle submissions       | `protocols/panx/src/oracle.ts:204-208` |
| Base64 raw      | Key transport for envelopes, settlement, custody | PANX, PvP, VaultMark source files      |
| Uint8Array      | In-memory key representation throughout          | `packages/crypto/index.ts:16,32-37`    |

---

## 5. Random Number Generation

All random bytes use `node:crypto randomBytes()` — cryptographically secure via OpenSSL CSPRNG (FIPS-approved).

| Usage                   | Size                   | Source File                                                                    |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| AES-256-GCM IV          | 12 bytes               | `packages/crypto/index.ts:51`                                                  |
| Custody challenge nonce | 16 bytes (hex-encoded) | `protocols/vaultmark/src/custody.ts:150`                                       |
| Entity ID suffix        | 4 bytes (hex-encoded)  | Multiple — audit events, custody records, escrow, settlement, role assignments |

---

## 6. Canonicalization

All signing uses deterministic JSON serialization to ensure consistent signature coverage regardless of field insertion order.

| Function                          | Location                                        | Used For                                              |
| --------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `stableStringify()`               | `protocols/panx/src/envelope.ts:170-182`        | Envelope signing — recursively sorts object keys      |
| `stableStringify()`               | `protocols/tradepass/src/verification.ts:70-82` | Credential verification                               |
| `canonicalizeEnvelope()`          | `protocols/panx/src/envelope.ts:184-188`        | Removes `signature` field before stableStringify      |
| `canonicalizeCredentialPayload()` | `protocols/tradepass/src/verification.ts:84-97` | Extracts and sorts signing-relevant credential fields |
| `serializeSubmission()`           | `protocols/panx/src/oracle.ts:145-153`          | Oracle submission fields serialized for signing       |

Credential canonicalization covers: `id`, `type`, `issuer`, `subject`, `issuanceDate`, `expirationDate`, `credentialSubject`, `status`, `metadata`.

---

## 7. Validation Rules

| Rule                                                    | Location                                          |
| ------------------------------------------------------- | ------------------------------------------------- |
| Private key must be `ed25519` asymmetric type           | `packages/crypto/index.ts:94-96`                  |
| Public key must be `ed25519` asymmetric type            | `packages/crypto/index.ts:105-107`                |
| AES key must be exactly 32 bytes                        | `packages/crypto/index.ts:50,63`                  |
| AES IV must be exactly 12 bytes                         | `packages/crypto/index.ts:67`                     |
| AES decryption requires `authTag`                       | `packages/crypto/index.ts:64-66`                  |
| Envelope must have non-empty `signature`                | `protocols/panx/src/envelope.ts:224`              |
| Credential must have `proof.signature`                  | `protocols/tradepass/src/verification.ts:125-133` |
| Oracle submission must have `signature` and `publicKey` | `protocols/panx/src/oracle.ts:181-186`            |
| Base64 format: `^[A-Za-z0-9+/]+={0,2}$`                 | `protocols/tradepass/src/verification.ts:105`     |

---

## 8. Key Storage — Current State and Risks

| Aspect                  | Current State                                                    | Risk   | Recommended Remediation                                  |
| ----------------------- | ---------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| Private key persistence | Keys passed as function parameters — library does not store keys | MEDIUM | Caller responsibility; document key storage requirements |
| Key at rest encryption  | None — keys in memory as raw byte arrays                         | HIGH   | KMS/HSM integration via CryptoProvider                   |
| Key rotation            | Not managed by library; `keyId` field exists for future use      | MEDIUM | Implement key rotation policy using `keyId`              |
| Key derivation          | Not in use — keys are pre-generated externally                   | N/A    | Add HKDF if symmetric key derivation is needed           |

---

## 9. FIPS 140-2 Status and Migration Path

**Current state:** All algorithms are FIPS-approved, but the runtime environment does not enforce FIPS mode:

- Node.js default build uses OpenSSL without FIPS module enabled.
- No `--enable-fips` flag in Dockerfile or runtime config.
- Alpine-bundled OpenSSL is not a FIPS 140-2 validated module.

**Migration path:**

| Priority | Item                            | Description                                                                                 |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| HIGH     | Enable FIPS OpenSSL module      | Use `crypto.setFips(1)` at startup or build with `--openssl-fips`                           |
| HIGH     | FIPS-validated Node.js image    | Switch to Red Hat UBI or equivalent with FIPS-validated OpenSSL                             |
| HIGH     | HSM-backed CryptoProvider       | Implement `CryptoProvider` backed by AWS CloudHSM or Azure Managed HSM (FIPS 140-2 Level 3) |
| MEDIUM   | KMS integration                 | AWS KMS or HashiCorp Vault for key storage and lifecycle                                    |
| MEDIUM   | FIPS self-test at startup       | Assert `crypto.getFips() === 1` during process initialization                               |
| LOW      | Remove `x25519` from type union | Clean up unused type or implement key agreement                                             |

The `CryptoProvider` interface is the migration seam — all protocol code uses it via dependency injection. Switching to a FIPS-validated provider requires no changes to protocol code.

```typescript
export interface CryptoProvider {
  sign(payload: Bytes, privateKey: Bytes, keyId?: string): Promise<Signature>;
  verify(payload: Bytes, signature: Signature, publicKey: Bytes): Promise<boolean>;
  encrypt(payload: Bytes, key: Bytes): Promise<EncryptionResult>;
  decrypt(result: EncryptionResult, key: Bytes): Promise<Bytes>;
}
```

---

## Reference

- [trust-model.md](../../1-architecture/trust-model.md)
- [threat-models.md](threat-models.md)
