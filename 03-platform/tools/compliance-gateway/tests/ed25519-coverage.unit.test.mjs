/**
 * @fileoverview Coverage-focused tests for ed25519 branches not
 * exercised by the main test file.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { generateEd25519KeyPair } from '../03-platform/src/audit-bundles/ed25519.mjs';

describe('generateEd25519KeyPair — error branch', () => {
  it('throws when generateKey returns an invalid shape', async () => {
    const original = crypto.subtle.generateKey;
    crypto.subtle.generateKey = async () => ({ publicKey: {} }); // missing privateKey
    try {
      await assert.rejects(
        () => generateEd25519KeyPair(),
        /Ed25519 key generation did not return a key pair/
      );
    } finally {
      crypto.subtle.generateKey = original;
    }
  });
});
