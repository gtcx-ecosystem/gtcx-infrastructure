import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { EMPTY_CATCH_RX } from './empty-catch-check.mjs';

function matches(src) {
  EMPTY_CATCH_RX.lastIndex = 0;
  return EMPTY_CATCH_RX.exec(src) !== null;
}

describe('empty-catch-check EMPTY_CATCH_RX', () => {
  it('matches `catch {}`', () => {
    assert.ok(matches('try { foo(); } catch {}'));
  });

  it('matches `catch (e) {}`', () => {
    assert.ok(matches('try { foo(); } catch (e) {}'));
  });

  it('matches destructured object param: `catch ({ code }) {}`', () => {
    assert.ok(matches('try { foo(); } catch ({ code }) {}'));
  });

  it('matches destructured array param: `catch ([first]) {}`', () => {
    assert.ok(matches('try { foo(); } catch ([first]) {}'));
  });

  it('matches body containing only a block comment', () => {
    assert.ok(matches('try { foo(); } catch (e) { /* intentional */ }'));
  });

  it('matches body containing only a line comment', () => {
    assert.ok(matches('try { foo(); } catch (e) {\n  // shutdown drain\n}'));
  });

  it('matches body containing both line + block comments', () => {
    assert.ok(
      matches(
        'try { foo(); } catch (e) { /* a */ // b\n /* c */ }',
      ),
    );
  });

  it('does NOT match catch with a statement (non-empty body)', () => {
    EMPTY_CATCH_RX.lastIndex = 0;
    assert.equal(
      EMPTY_CATCH_RX.exec('try { foo(); } catch (e) { console.error(e); }'),
      null,
    );
  });

  it('does NOT match catch with a statement after a comment', () => {
    EMPTY_CATCH_RX.lastIndex = 0;
    assert.equal(
      EMPTY_CATCH_RX.exec(
        'try { foo(); } catch (e) { /* log */ console.error(e); }',
      ),
      null,
    );
  });
});
