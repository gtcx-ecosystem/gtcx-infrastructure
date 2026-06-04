/**
 * Minimal multibase/base58btc utilities for DID resolver.
 *
 * Supports Ed25519 public keys encoded as multibase (base58btc, z-prefix)
 * per Ed25519VerificationKey2020. No external dependencies.
 */

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map([...BASE58_ALPHABET].map((c, i) => [c, BigInt(i)]));

/**
 * Decode a base58btc string to Buffer.
 * @param {string} str
 * @returns {Buffer}
 */
export function base58btcDecode(str) {
  if (typeof str !== 'string' || str.length === 0) {
    throw new TypeError('base58btcDecode requires a non-empty string');
  }

  let zeros = 0;
  while (zeros < str.length && str[zeros] === '1') zeros += 1;

  const size = Math.floor(((str.length - zeros) * 733) / 1000) + 1;
  const decoded = new Uint8Array(size);
  let outputLength = 0;

  for (let i = zeros; i < str.length; i += 1) {
    const char = str[i];
    const val = BASE58_MAP.get(char);
    if (val === undefined) {
      throw new TypeError(`Invalid base58 character: ${char}`);
    }

    let carry = val;
    let j = 0;
    for (let k = size - 1; (carry !== 0n || j < outputLength) && k >= 0; k -= 1, j += 1) {
      carry += 58n * BigInt(decoded[k]);
      decoded[k] = Number(carry % 256n);
      carry = carry / 256n;
    }
    outputLength = j;
  }

  let index = size - outputLength;
  while (index < size && decoded[index] === 0) index += 1;

  const result = Buffer.alloc(zeros + (size - index));
  result.fill(0, 0, zeros);
  let offset = zeros;
  for (let i = index; i < size; i += 1) {
    result[offset++] = decoded[i];
  }
  return result;
}

/**
 * Convert a multibase-encoded Ed25519 public key to JWK.
 *
 * Expected format: `z<base58btc>` where the decoded bytes are:
 *   [0xed, 0x01, <32-byte raw Ed25519 public key>]
 *
 * Returns: { kty: 'OKP', crv: 'Ed25519', x: '<base64url>' }
 *
 * @param {string} multibase
 * @returns {object}
 */
export function ed25519MultibaseToJwk(multibase) {
  if (typeof multibase !== 'string' || !multibase.startsWith('z')) {
    throw new TypeError('Ed25519 multibase must start with z (base58btc)');
  }

  const bytes = base58btcDecode(multibase.slice(1));

  // Multicodec prefix for ed25519-pub is 0xed 0x01
  const expectedPrefix = Buffer.from([0xed, 0x01]);
  const hasPrefix = bytes.length >= expectedPrefix.length + 32 &&
    bytes.slice(0, expectedPrefix.length).equals(expectedPrefix);

  if (hasPrefix && bytes.length < expectedPrefix.length + 32) {
    throw new TypeError(`Ed25519 multibase too short: ${bytes.length} bytes`);
  }
  if (!hasPrefix && bytes.length !== 32) {
    throw new TypeError(`Ed25519 public key must be 32 bytes, got ${bytes.length}`);
  }

  const rawKey = hasPrefix ? bytes.slice(expectedPrefix.length) : bytes;

  if (rawKey.length !== 32) {
    throw new TypeError(`Ed25519 public key must be 32 bytes, got ${rawKey.length}`);
  }

  return {
    kty: 'OKP',
    crv: 'Ed25519',
    x: rawKey.toString('base64url'),
  };
}
