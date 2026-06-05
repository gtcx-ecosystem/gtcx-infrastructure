/**
 * @fileoverview USSD Handler Configuration
 *
 * Environment-driven config with safe defaults.
 */

export const config = {
  port: Number(process.env.USSD_PORT ?? 8600),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  sessionTtlSeconds: Number(process.env.USSD_SESSION_TTL_SECONDS ?? (process.env.NODE_ENV === 'test' ? 2 : 120)),
  pinLockoutMinutes: Number(process.env.USSD_PIN_LOCKOUT_MINUTES ?? 15),
  maxPinAttempts: Number(process.env.USSD_MAX_PIN_ATTEMPTS ?? 3),
  redisUrl: process.env.REDIS_URL ?? null,
  scryptParams: {
    N: process.env.NODE_ENV === 'test' ? 64 : 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  },
};
