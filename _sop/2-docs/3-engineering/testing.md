# Testing

Testing strategy, tooling, test types, acceptance criteria, and offline testing requirements for the GTCX Protocol monorepo.

---

## Testing Philosophy

Five non-negotiable principles govern all testing:

| Principle              | Meaning                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Shift left**         | Catch issues in development, not in production. Tests run at every commit.                                           |
| **Automation first**   | Everything that can be automated must be automated. Manual testing is reserved for exploratory and edge cases only.  |
| **Production parity**  | Test environments mirror production data volumes, connectivity patterns, and latency profiles.                       |
| **Security as code**   | Security testing is integrated into CI/CD — not a separate phase. Vulnerability scanning runs on every build.        |
| **Offline validation** | All offline scenarios are tested explicitly. Sync, conflict resolution, and queue replay have dedicated test suites. |

---

## Test Pyramid

```
                    ┌─────────┐
                    │   E2E   │  5% — Slow, high confidence
                  ┌─┴─────────┴─┐
                  │ Integration │  20% — Cross-protocol, cross-boundary
                ┌─┴─────────────┴─┐
                │   Component     │  25% — Module-level, isolated
              ┌─┴─────────────────┴─┐
              │      Unit Tests      │  50% — Function-level, fast
              └─────────────────────┘

  Parallel tracks (all environments):
  ┌──────────┐ ┌─────────────┐ ┌───────┐ ┌────────────┐
  │ Security │ │ Performance │ │ Chaos │ │ Compliance │
  └──────────┘ └─────────────┘ └───────┘ └────────────┘
```

---

## 1. Unit Tests

**Target:** 50% of total test volume. All business logic at the function level.

**Tooling:** Vitest (TypeScript), pytest (Python)

**Coverage thresholds (minimum acceptable):**

| Metric     | Threshold |
| ---------- | --------- |
| Statements | 80%       |
| Branches   | 75%       |
| Functions  | 80%       |
| Lines      | 80%       |

**Patterns:**

- Co-locate test files with source: `foo.ts` → `foo.test.ts` in the same directory.
- Use `vi.useFakeTimers()` for any test that depends on timestamps or expiry logic.
- Use `vi.mock()` for external dependencies (network, crypto primitives) — never in integration tests.
- Test the contract, not the implementation: test observable inputs and outputs, not internal state.

```typescript
// Example: unit test for DID generation
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TradePass DID Generation', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('should generate valid DID format', async () => {
    const did = generateDID('tp', publicKey);
    expect(did).toMatch(/^did:gtcx:tp_[a-f0-9]{16}$/);
  });

  it('should generate unique DIDs for different keys', async () => {
    const did1 = generateDID('tp', keyPair1.publicKey);
    const did2 = generateDID('tp', keyPair2.publicKey);
    expect(did1).not.toBe(did2);
  });
});
```

---

## 2. Component Tests

**Target:** 25% of total test volume. Module boundaries within a single protocol.

These tests exercise a full protocol module in isolation — the full in-memory state machine, all handler paths, all schema validation — but with mocked external dependencies (other protocols, persistence).

**Key scenarios to cover per protocol:**

| Protocol  | Required Component Test Coverage                                                        |
| --------- | --------------------------------------------------------------------------------------- |
| TradePass | DID creation, credential issuance, role assignment, revocation, permission checks       |
| GeoTag    | Location submission, boundary validation, spoofing detection, offline queue replay      |
| GCI       | Score calculation, factor weighting, threshold tier transitions, appeal state machine   |
| VaultMark | Custody record creation, transfer initiation, challenge/response, event chain integrity |
| PvP       | Escrow creation, funding, GCI score gate, settlement execution, dispute flow            |
| PANX      | Message envelope signing/verification, consensus quorum calculation, oracle submission  |

---

## 3. Integration Tests

**Target:** 20% of total test volume. Cross-protocol flows and cross-system boundaries.

Integration tests exercise the full protocol stack with real (or near-real) dependencies but in a controlled environment. No mocks for the protocols under test.

**Required integration scenarios:**

1. **Full provenance flow** — GeoTag → VaultMark asset creation (origin anchor validation)
2. **Settlement flow** — VaultMark custody + GCI score gate + PvP escrow + PANX consensus
3. **Offline sync** — Device goes offline, accumulates operations, reconnects, replays in order
4. **Conflict resolution** — Two offline devices modify the same custody record; sync produces canonical state
5. **Credential revocation cascade** — TradePass revocation propagates to block active operations in other protocols

---

## 4. End-to-End Tests

**Target:** 5% of total test volume. Full user flows in a production-like environment.

E2E tests run against the testnet network with real API keys. They are the slowest tests and run only in CI on the main branch and release branches.

**Required E2E scenarios:**

1. Producer onboarding through TradePass credential issuance
2. GeoTag capture at extraction site → VaultMark asset creation
3. Full custody chain transfer from producer → aggregator → vault
4. PvP settlement with multi-currency payment
5. PANX consensus for a high-value transfer

---

## 5. Offline Testing

All protocols with offline capability must have explicit offline test suites. Offline testing validates two things: correct behavior without network, and correct sync behavior when connectivity returns.

**Offline test scenarios (required per protocol):**

| Scenario                 | What to Test                                                       |
| ------------------------ | ------------------------------------------------------------------ |
| Queue accumulation       | Operations queue correctly up to the protocol's offline limit      |
| Queue overflow           | Operations beyond the limit are rejected with clear errors         |
| Offline-first operations | Operations complete correctly without network I/O                  |
| Reconnect replay         | Queued operations replay in sequence; no duplicates; correct order |
| Conflict detection       | Concurrent offline modifications detected on sync                  |
| Conflict resolution      | CRDT merge produces correct canonical state                        |
| Cached credential expiry | Expired cached credentials rejected even offline                   |

**Offline limits by protocol:**

| Protocol  | Max Offline Duration   | Queue Limit                       |
| --------- | ---------------------- | --------------------------------- |
| TradePass | 45 days                | N/A (credential cache)            |
| GeoTag    | 30 days                | 1,000 location captures           |
| GCI       | 30 days                | N/A (score cache)                 |
| VaultMark | 30 days                | 500 transfers                     |
| PvP       | N/A (requires network) | Queue only — no offline execution |

---

## 6. Security Testing

Security tests run in CI on every PR. They are not optional.

**Required security test categories:**

| Category               | What                                                           | Tool                                     |
| ---------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| Input validation       | All Zod schema boundaries reject malformed inputs              | Vitest with adversarial payloads         |
| Injection              | Protocol boundaries reject XSS, SQL injection, path traversal  | Automated fuzz inputs in component tests |
| Replay attacks         | Signed messages with replayed nonces are rejected              | Explicit replay test per protocol        |
| Signature verification | Invalid signatures fail verifiably                             | Test with tampered payloads              |
| Stub guard             | `enforceStubGuard()` blocks in-memory stores in production env | CI environment variable injection        |
| Dependency scan        | Known vulnerable dependencies flagged                          | `pnpm audit` in CI                       |

---

## 7. Performance Benchmarks

Performance tests run on release branches. Acceptance criteria:

| Operation                  | Target  | Maximum |
| -------------------------- | ------- | ------- |
| DID resolution (cached)    | < 10ms  | 50ms    |
| Credential verification    | < 50ms  | 200ms   |
| GCI score calculation      | < 100ms | 500ms   |
| VaultMark custody transfer | < 200ms | 1s      |
| PvP settlement (with PANX) | < 2s    | 10s     |
| GeoTag location validation | < 500ms | 2s      |

---

## 8. Running Tests

```bash
# All tests across all packages
pnpm test

# Watch mode (development)
pnpm test --watch

# Coverage report
pnpm test --coverage

# Specific protocol
pnpm test --filter @gtcx/protocol-tradepass

# Specific test file
pnpm test protocols/tradepass/src/credentials.test.ts

# Integration tests only
pnpm test:integration

# E2E tests (requires GTCX_API_KEY)
pnpm test:e2e
```

---

## 9. CI Acceptance Criteria

A PR cannot merge unless all of the following pass:

- [ ] All unit tests pass with zero failures
- [ ] Coverage thresholds met (statements 80%, branches 75%, functions 80%, lines 80%)
- [ ] All integration tests pass
- [ ] No new `any` types introduced (TypeScript strict mode)
- [ ] ESLint passes with zero errors
- [ ] `pnpm audit` shows no HIGH or CRITICAL vulnerabilities
- [ ] Security tests pass (replay, stub guard, signature verification)

E2E and performance tests are advisory on PRs; they are required for release tagging.

---

## Reference

- [code-standards.md](code-standards.md)
- [git-workflow.md](git-workflow.md)
