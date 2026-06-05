/**
 * Response field trimmer for minimal-mode bandwidth reduction.
 *
 * Removes non-essential fields from API responses based on schema
 * allowlists, achieving ≥70% payload reduction for well-defined schemas.
 */

/**
 * Recursively trim an object to only allowed fields.
 *
 * @param {unknown} value
 * @param {string[] | Set<string>} allowed
 * @returns {unknown}
 */
export function trimObject(value, allowed) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => trimObject(item, allowed));
  }
  const allowedSet =
    allowed instanceof Set ? allowed : new Set(allowed);
  const result = {};
  for (const key of Object.keys(value)) {
    if (allowedSet.has(key)) {
      result[key] = value[key];
    }
  }
  return result;
}

/**
 * Build a minimal-mode response from a full response and schema.
 *
 * @param {object} options
 * @param {unknown} options.data
 * @param {string[]} options.essentialFields
 * @param {unknown} [options.fallback]
 * @returns {unknown}
 */
export function buildMinimalResponse({ data, essentialFields, fallback }) {
  if (data === null || data === undefined) {
    return fallback ?? null;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (!essentialFields || essentialFields.length === 0) {
    return data;
  }
  return trimObject(data, essentialFields);
}

/**
 * Estimate payload size reduction from trimming.
 *
 * @param {object} options
 * @param {string} options.fullJson
 * @param {string} options.trimmedJson
 * @returns {{ originalBytes: number; trimmedBytes: number; reductionPercent: number }}
 */
export function estimateReduction({ fullJson, trimmedJson }) {
  const originalBytes = Buffer.byteLength(fullJson, 'utf8');
  const trimmedBytes = Buffer.byteLength(trimmedJson, 'utf8');
  const reductionPercent =
    originalBytes === 0
      ? 0
      : Math.round(((originalBytes - trimmedBytes) / originalBytes) * 100);
  return { originalBytes, trimmedBytes, reductionPercent };
}
