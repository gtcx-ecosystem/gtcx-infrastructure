/**
 * Content negotiation for adaptive low-bandwidth mode.
 *
 * Determines the appropriate encoding level from request headers
 * and query parameters per the gtcx-lbw-v1 protocol.
 */

/** @typedef {'normal' | 'reduced' | 'minimal' | 'offline'} BandwidthLevel */

const LEVEL_ORDER = ['normal', 'reduced', 'minimal', 'offline'];

/**
 * Parse the Accept-Encoding header for gtcx-lbw-v1 support.
 *
 * @param {string | string[] | undefined} header
 * @returns {boolean}
 */
export function acceptsLowBandwidth(header) {
  if (!header) return false;
  const value = Array.isArray(header) ? header.join(',') : String(header);
  return value.includes('gtcx-lbw-v1');
}

/**
 * Determine the bandwidth level from query parameters and headers.
 *
 * Priority:
 * 1. Explicit `?mode=` query parameter
 * 2. `Accept-Encoding: gtcx-lbw-v1` header
 * 3. Default to 'normal'
 *
 * @param {object} options
 * @param {string | undefined} [options.mode]
 * @param {string | string[] | undefined} [options.acceptEncoding]
 * @returns {BandwidthLevel}
 */
export function resolveLevel({ mode, acceptEncoding } = {}) {
  if (mode) {
    const normalized = String(mode).toLowerCase().trim();
    if (LEVEL_ORDER.includes(normalized)) {
      return /** @type {BandwidthLevel} */ (normalized);
    }
  }
  if (acceptsLowBandwidth(acceptEncoding)) {
    return 'reduced';
  }
  return 'normal';
}

/**
 * Select the most restrictive level when multiple signals conflict.
 *
 * @param {BandwidthLevel[]} levels
 * @returns {BandwidthLevel}
 */
export function mostRestrictive(levels) {
  if (!levels || levels.length === 0) return 'normal';
  let maxIndex = -1;
  for (const level of levels) {
    const idx = LEVEL_ORDER.indexOf(level);
    if (idx !== -1 && idx > maxIndex) {
      maxIndex = idx;
    }
  }
  return maxIndex === -1 ? 'normal' : LEVEL_ORDER[maxIndex];
}

/**
 * Get the encoding label for a given level.
 *
 * @param {BandwidthLevel} level
 * @returns {string}
 */
export function encodingForLevel(level) {
  switch (level) {
    case 'normal':
      return 'json';
    case 'reduced':
      return 'compact-json';
    case 'minimal':
      return 'minimal-binary';
    case 'offline':
      return 'none';
    default:
      return 'json';
  }
}

/**
 * Get the recommended replay window in minutes for a level.
 *
 * @param {BandwidthLevel} level
 * @returns {number}
 */
export function replayWindowForLevel(level) {
  switch (level) {
    case 'normal':
      return 5;
    case 'reduced':
    case 'minimal':
    case 'offline':
      return 15;
    default:
      return 5;
  }
}
