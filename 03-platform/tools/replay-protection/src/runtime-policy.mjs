/**
 * @param {{
 *   nodeEnv: string,
 *   redisConfigured: boolean,
 *   redisConnected: boolean,
 * }} input
 * @returns {string | null}
 */
export function getTrafficBlockReason(input) {
  if (input.nodeEnv !== 'production') {
    return null;
  }
  if (!input.redisConfigured) {
    return 'Durable nonce store is required in production: REDIS_URL is not set.';
  }
  if (!input.redisConnected) {
    return 'Durable nonce store is unavailable in production. Replay verification is blocked until Redis connectivity is restored.';
  }
  return null;
}
