/**
 * @fileoverview USSD PIN Authentication
 *
 * PIN verification using scrypt (memory-hard KDF).
 * Production note: migrate to Argon2id when native module availability is guaranteed.
 */

import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

import { config } from './config.mjs';

const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Hash a PIN for storage using PBKDF2.
 * Production note: migrate to Argon2id or scrypt when native module availability is guaranteed.
 * @param {string} pin
 * @returns {string} base64-encoded salt + hash
 */
export function hashPin(pin) {
  const salt = randomBytes(SALT_LENGTH);
  const iterations = config.nodeEnv === 'test' ? 1 : 100000;
  const hash = pbkdf2Sync(pin, salt, iterations, KEY_LENGTH, 'sha256');
  return Buffer.concat([salt, hash]).toString('base64');
}

/**
 * Verify a PIN against a stored hash.
 * @param {string} pin
 * @param {string} storedHash base64-encoded salt + hash
 * @returns {boolean}
 */
export function verifyPin(pin, storedHash) {
  try {
    const combined = Buffer.from(storedHash, 'base64');
    const salt = combined.subarray(0, SALT_LENGTH);
    const expectedHash = combined.subarray(SALT_LENGTH);
    const iterations = config.nodeEnv === 'test' ? 1 : 100000;
    const actualHash = pbkdf2Sync(pin, salt, iterations, KEY_LENGTH, 'sha256');
    return timingSafeEqual(expectedHash, actualHash);
  } catch {
    return false;
  }
}

/**
 * Check if a user is currently locked out.
 * @param {Record<string, string> | null} session
 * @returns {{ locked: boolean, remainingMinutes?: number }}
 */
export function checkLockout(session) {
  const attempts = Number(session?.['pin-attempts'] ?? 0);
  if (attempts < config.maxPinAttempts) {
    return { locked: false };
  }
  const lockedAt = Number(session?.['pin-locked-at'] ?? 0);
  const elapsedMs = Date.now() - lockedAt;
  const lockoutMs = config.pinLockoutMinutes * 60 * 1000;
  if (elapsedMs >= lockoutMs) {
    return { locked: false };
  }
  return {
    locked: true,
    remainingMinutes: Math.ceil((lockoutMs - elapsedMs) / 60000),
  };
}

/**
 * Record a failed PIN attempt. Returns updated session fields.
 * @param {Record<string, string> | null} session
 * @returns {Record<string, string>}
 */
export function recordFailedAttempt(session) {
  const attempts = Number(session?.['pin-attempts'] ?? 0) + 1;
  const updates = { 'pin-attempts': String(attempts) };
  if (attempts >= config.maxPinAttempts) {
    updates['pin-locked-at'] = String(Date.now());
  }
  return updates;
}

/**
 * Reset PIN attempts on successful verification.
 * @returns {Record<string, string>}
 */
export function resetAttempts() {
  return { 'pin-attempts': '0', 'pin-locked-at': '' };
}
