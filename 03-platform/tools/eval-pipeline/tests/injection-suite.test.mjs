/**
 * @fileoverview Static defenses around the prompt-injection suite.
 *
 * The full LLM-driven red-team runs in the eval-pipeline CI job; here
 * we only verify that the schema validates each payload (so it actually
 * reaches the model) and that buildUserMessage wraps the context in
 * the delimiter markers the system prompt instructs the model to honor.
 *
 * If a payload starts failing the schema, either the schema got too
 * strict and we lost a known attack vector from the suite, or the
 * payload needs updating — both deserve a human look.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { INJECTION_PAYLOADS, runStaticChecks } from '../injection-suite.mjs';

describe('injection suite static checks', () => {
  it('has at least 18 payloads', () => {
    assert.ok(INJECTION_PAYLOADS.length >= 18, `expected ≥18 payloads, got ${INJECTION_PAYLOADS.length}`);
  });

  it('covers at least 3 non-English jailbreak languages', () => {
    const langs = INJECTION_PAYLOADS.filter((p) => /spanish|french|swahili/i.test(p.description));
    assert.ok(langs.length >= 3, `expected ≥3 non-English jailbreaks, got ${langs.length}`);
  });

  it('covers at least 2 encoded-payload attempts', () => {
    const encoded = INJECTION_PAYLOADS.filter((p) =>
      /base64|url|rot13|zero-width/i.test(p.description),
    );
    assert.ok(encoded.length >= 2, `expected ≥2 encoded payloads, got ${encoded.length}`);
  });

  it('covers at least 2 prompt-leak attempts', () => {
    const leaks = INJECTION_PAYLOADS.filter((p) => /prompt-leak|leak|system prompt/i.test(p.description));
    assert.ok(leaks.length >= 2, `expected ≥2 prompt-leak attempts, got ${leaks.length}`);
  });

  it('every payload passes schema validation', () => {
    const results = runStaticChecks();
    const failures = results.filter((r) => !r.schemaPassed);
    assert.strictEqual(
      failures.length,
      0,
      `payloads must validate; failing: ${JSON.stringify(failures)}`,
    );
  });

  it('every accepted payload is wrapped in BEGIN/END delimiters', () => {
    const results = runStaticChecks();
    const undelimited = results.filter(
      (r) => r.schemaPassed && (!r.hasDelimiter || !r.hasEndDelimiter),
    );
    assert.strictEqual(
      undelimited.length,
      0,
      `delimiter missing on: ${JSON.stringify(undelimited)}`,
    );
  });

  it('every payload has a unique id', () => {
    const ids = INJECTION_PAYLOADS.map((p) => p.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'duplicate payload ids');
  });
});
