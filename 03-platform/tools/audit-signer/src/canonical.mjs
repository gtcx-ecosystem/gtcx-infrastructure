/**
 * Deterministic JSON serialization (JCS-style) for catalog and artifact signing.
 * Audit record signing uses {@link canonicalize} in signer.mjs for the fixed
 * audit record field order.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalizeValue(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeValue).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalizeValue(value[k])}`).join(',')}}`;
}
