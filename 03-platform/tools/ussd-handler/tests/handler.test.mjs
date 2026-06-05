/**
 * @fileoverview USSD Handler Logic Tests
 */

import assert from 'node:assert';
import { describe, it, afterEach } from 'node:test';

import { hashPin } from '../03-platform/src/auth.mjs';
import { processUssdRequest, parseUssdString, buildSessionId } from '../03-platform/src/handler.mjs';
import { MemorySessionStore } from '../03-platform/src/session.mjs';

describe('parseUssdString', () => {
  it('parses full USSD string', () => {
    const result = parseUssdString('*384*1*2#');
    assert.deepStrictEqual(result.inputs, ['1', '2']);
  });

  it('handles simple dial', () => {
    const result = parseUssdString('*384#');
    assert.deepStrictEqual(result.inputs, []);
  });

  it('ignores empty parts', () => {
    const result = parseUssdString('*384*1**2#');
    assert.deepStrictEqual(result.inputs, ['1', '2']);
  });
});

describe('buildSessionId', () => {
  it('builds deterministic session ID', () => {
    const id = buildSessionId('+263771234567', ['1', '2']);
    assert.strictEqual(id, '263771234567:1');
  });

  it('handles root session', () => {
    const id = buildSessionId('+263771234567', []);
    assert.strictEqual(id, '263771234567:root');
  });
});

describe('processUssdRequest — flows', () => {
  const stores = [];

  afterEach(async () => {
    for (const store of stores) {
      for (const [sid] of store.sessions) {
        await store.deleteSession(sid);
      }
    }
    stores.length = 0;
  });

  it('welcomes new user', async () => {
    const store = new MemorySessionStore({ ttlSeconds: 1 });
    stores.push(store);
    const result = await processUssdRequest({
      sessionId: 's1',
      phoneNumber: '+260771234567',
      input: '1',
      countryCode: 'ZM',
    }, store);
    assert.ok(result.text.includes('Select country'));
    assert.strictEqual(result.end, false);
  });

  it('exits on 0', async () => {
    const store = new MemorySessionStore({ ttlSeconds: 1 });
    stores.push(store);
    const result = await processUssdRequest({
      sessionId: 's1',
      phoneNumber: '+263771234567',
      input: '0',
      countryCode: 'ZW',
    }, store);
    assert.ok(result.end);
  });

  it('shows prices after country selection', async () => {
    const store = new MemorySessionStore({ ttlSeconds: 1 });
    stores.push(store);
    await store.setSession('s1', {
      phone: '+263771234567',
      'menu-stack': 'prices-action',
      'selected-country': 'ZW',
      'pin-attempts': '0',
    });
    const result = await processUssdRequest({
      sessionId: 's1',
      phoneNumber: '+263771234567',
      input: '1',
      countryCode: 'ZW',
    }, store);
    assert.ok(result.text.includes('Maize'));
  });

  it('locks out after 3 failed PIN attempts', async () => {
    const store = new MemorySessionStore({ ttlSeconds: 1 });
    stores.push(store);
    const hash = hashPin('9999');
    await store.setSession('s1', {
      phone: '+263771234567',
      'menu-stack': 'wallet-pin',
      'pin-hash': hash,
      'pin-attempts': '2',
      'preferred-lang': '',
    });
    const result = await processUssdRequest({
      sessionId: 's1',
      phoneNumber: '+263771234567',
      input: '0000',
      countryCode: 'ZW',
    }, store);
    assert.ok(result.text.includes('locked') || result.text.includes('sungwa') || result.text.includes('verrouille'));
    assert.strictEqual(result.end, true);
  });

  it('accepts correct PIN and proceeds', async () => {
    const store = new MemorySessionStore({ ttlSeconds: 1 });
    stores.push(store);
    const hash = hashPin('1234');
    await store.setSession('s1', {
      phone: '+263771234567',
      'menu-stack': 'wallet-pin',
      'pin-hash': hash,
      'pin-attempts': '0',
      'preferred-lang': '',
    });
    const result = await processUssdRequest({
      sessionId: 's1',
      phoneNumber: '+263771234567',
      input: '1234',
      countryCode: 'ZW',
    }, store);
    assert.ok(result.text.includes('Wallet') || result.text.includes('wallet') || result.text.includes('Portefeuille'));
  });

  it('handles session expiry by creating new session', async () => {
    const store = new MemorySessionStore({ ttlSeconds: 1 });
    stores.push(store);
    const result = await processUssdRequest({
      sessionId: 'expired',
      phoneNumber: '+263771234567',
      input: '5',
      countryCode: 'ZW',
    }, store);
    assert.ok(result.text.includes('Help') || result.text.includes('Rubatsiro') || result.text.includes('Usaidizi'));
  });

  it('returns lockout message when account is locked', async () => {
    const store = new MemorySessionStore({ ttlSeconds: 1 });
    stores.push(store);
    await store.setSession('s1', {
      phone: '+263771234567',
      'menu-stack': 'root',
      'pin-attempts': '3',
      'pin-locked-at': String(Date.now()),
    });
    const result = await processUssdRequest({
      sessionId: 's1',
      phoneNumber: '+263771234567',
      input: '1',
      countryCode: 'ZM',
    }, store);
    assert.ok(result.text.includes('locked') || result.text.includes('sungwa'));
    assert.strictEqual(result.end, true);
  });

  it('returns remaining attempts after failed PIN', async () => {
    const store = new MemorySessionStore({ ttlSeconds: 1 });
    stores.push(store);
    const hash = hashPin('9999');
    await store.setSession('s1', {
      phone: '+263771234567',
      'menu-stack': 'wallet-pin',
      'pin-hash': hash,
      'pin-attempts': '1',
    });
    const result = await processUssdRequest({
      sessionId: 's1',
      phoneNumber: '+263771234567',
      input: '0000',
      countryCode: 'ZM',
    }, store);
    assert.ok(result.text.includes('attempts remaining') || result.text.includes('miedzo'));
    assert.strictEqual(result.end, false);
  });
});
