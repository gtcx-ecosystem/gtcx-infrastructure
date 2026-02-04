# GTCX Testing Framework

| Field | Value |
|-------|-------|
| Scope | All code repositories in the GTCX ecosystem |
| Status | Specification |
| Related | [CI/CD Pipeline](./cicd-pipeline.md), [Resilience Framework](./resilience-framework.md) |

## Design Principles

1. **Every module has automated tests** -- Untested code is unverified code. A function without a test is a liability, not an asset.
2. **Property-based testing is mandatory for cryptographic operations** -- Ed25519, SHA-256, Merkle proofs, and ZKP primitives require proof of invariant correctness, not just example-based coverage.
3. **Tests run automatically on every PR** -- No merge without green tests. No exceptions, no overrides, no "I'll add tests later."
4. **Test the behavior, not the implementation** -- Tests assert what the system does, not how it does it. Refactoring should not break tests.

## Test Taxonomy

| Type | Definition | When to Use | Framework | Example |
|------|-----------|-------------|-----------|---------|
| Unit | Isolated test of a single function or class with mocked dependencies | Every public function, every branch | Vitest (TS), pytest (Python), cargo test (Rust) | `verifySignature()` returns true for valid Ed25519 signature |
| Integration | Test of two or more modules with real dependencies (DB, services) | API boundaries, database queries, service interactions | Vitest + testcontainers, pytest + fixtures | NestJS controller → service → PostgreSQL roundtrip |
| Property-based | Randomized inputs testing invariants over thousands of cases | All cryptographic operations, serialization, CRDT merges | fast-check (TS), hypothesis (Python), proptest (Rust) | `sign(msg, sk)` always verifies with corresponding `pk` for any `msg` |
| E2E | Full user flow through deployed services | Critical user journeys, settlement flows, verification chains | Playwright (web), Detox (mobile), k6 (API) | Trader creates TradePass → uploads GeoTag → receives GCI score |
| Security | Targeted tests for OWASP Top 10, auth boundaries, input sanitization | All API endpoints, authentication flows, data boundaries | Vitest + custom matchers, OWASP ZAP | SQL injection payloads rejected at every API input |
| Accessibility | Automated WCAG 2.1 AA compliance checks | All interactive UI components, all user flows | axe-core + Vitest, Storybook a11y addon | Every button has accessible name; every form has labels |
| Offline | Simulated connectivity scenarios from full-offline to intermittent | All protocol operations, sync engine, queue behavior | Vitest + custom network mocks, Detox | L0 complete offline: all 6 protocols operate independently |

## Framework Standards

| Language | Test Framework | Property-Based | Coverage Tool | Assertion Style |
|----------|---------------|----------------|---------------|-----------------|
| TypeScript | Vitest 2.x | fast-check | @vitest/coverage-v8 | expect() with built-in matchers |
| Python | pytest 7.x | hypothesis | pytest-cov | assert with pytest introspection |
| Rust | cargo test | proptest | cargo-tarpaulin | assert!, assert_eq! macros |

**Monorepo execution**: All TypeScript repositories use Turborepo for parallel test execution. `turbo run test` respects package dependency graph and caches results.

## Coverage Targets

| Repository / Package | Minimum Coverage | Rationale |
|---------------------|-----------------|-----------|
| gtcx-core/crypto | 95% | Cryptographic correctness is existential; a single untested path can compromise the entire trust model |
| gtcx-core/security | 90% | Authentication and authorization boundaries protect every service in the ecosystem |
| gtcx-protocols/sdk-ts | 90% | Protocol SDK is the integration surface for all platforms and third-party consumers |
| gtcx-protocols/sdk-python | 90% | Python SDK parity with TypeScript SDK; same integration surface |
| gtcx-platforms/crx-api | 80% | NestJS services with well-defined API boundaries and input validation |
| gtcx-platforms/sgx-api | 80% | NestJS services with well-defined API boundaries and input validation |
| gtcx-platforms/agx-api | 80% | NestJS services with well-defined API boundaries and input validation |
| gtcx-app/packages/sync | 80% | Offline sync engine correctness is critical to data integrity |
| gtcx-app/packages/events | 80% | Event bus reliability affects all cross-module communication |
| gtcx-app/packages/connectivity | 80% | Network state detection drives degradation behavior |
| gtcx-app/packages/api-client | 80% | API client is the trust boundary between mobile and backend |
| gtcx-design/ui | 70% | Component rendering; visual regression handled separately |
| gtcx-design/i18n | 85% | Translation completeness across all supported locales |

**Enforcement**: Coverage thresholds are enforced in CI. A PR that drops coverage below the threshold for any package is blocked from merging. See [CI/CD Pipeline](./cicd-pipeline.md) for gate configuration.

## Property-Based Testing Requirements

Property-based testing is mandatory for ALL cryptographic operations in `gtcx-core/crypto`. The following invariants must be tested with a minimum of 1,000 random inputs per property:

| Operation | Invariant | fast-check Arbitrary | Min Runs |
|-----------|-----------|---------------------|----------|
| Ed25519 sign/verify | `verify(sign(msg, sk), msg, pk)` is always `true` | `fc.uint8Array({minLength: 0, maxLength: 4096})` for msg | 1,000 |
| Ed25519 wrong key | `verify(sign(msg, sk1), msg, pk2)` is always `false` | `fc.uint8Array()` for msg, distinct key pairs | 1,000 |
| SHA-256 determinism | `hash(x) === hash(x)` for all inputs | `fc.string()` | 1,000 |
| SHA-256 collision resistance | `hash(x) !== hash(y)` when `x !== y` | `fc.tuple(fc.string(), fc.string()).filter(([a,b]) => a !== b)` | 10,000 |
| Merkle proof generation | `verifyProof(generateProof(tree, leaf), root)` is always `true` | `fc.array(fc.uint8Array(), {minLength: 1, maxLength: 256})` | 1,000 |
| Merkle proof tamper | Flipping any bit in proof causes verification failure | `fc.array(fc.uint8Array(), {minLength: 2})` + bit flip | 1,000 |
| Key derivation determinism | `derivePublicKey(sk)` produces identical output on repeat calls | `fc.uint8Array({minLength: 32, maxLength: 32})` | 1,000 |
| Commitment scheme | `verifyCommitment(commit(value, salt), value, salt)` is always `true` | `fc.tuple(fc.string(), fc.string())` | 1,000 |
| Commitment hiding | `commit(v, s1) !== commit(v, s2)` when `s1 !== s2` | `fc.string()` for value, distinct salts | 1,000 |

## Test Pyramid

```
          /‾‾‾‾‾‾\
         /  E2E   \          10% of test count
        /  (Playw.) \
       /‾‾‾‾‾‾‾‾‾‾‾‾\
      / Integration    \      20% of test count
     /  (real deps)     \
    /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
   /    Unit + Property    \  70% of test count
  / (isolated, fast, many)  \
 /____________________________\
```

Target ratio per repository. Property-based tests count toward the unit test proportion. Integration tests use testcontainers or fixture-based setups -- never shared mutable state.

## CI Test Gates

| Gate | Trigger | Requirements | Timeout | Failure Action |
|------|---------|-------------|---------|----------------|
| Pre-commit | `git commit` (husky hook) | Lint (ESLint/Biome) + type-check (`tsc --noEmit`) | 60s | Block commit |
| PR Quality | PR opened / updated | All tests pass + coverage thresholds met + no TypeScript errors | 10 min | Block merge |
| Main Build | Merge to `main` | Full test suite + security scan (Trivy, TruffleHog) + license check | 15 min | Alert team + block deployment |
| Release | Git tag `v*` | Full suite + E2E + performance baseline comparison | 30 min | Block release publication |

See [CI/CD Pipeline](./cicd-pipeline.md) for detailed stage configuration and workflow templates.

## Test Organization

Standard directory structure for every package in the ecosystem:

```
packages/{name}/
  src/
    index.ts
    ...
  tests/
    unit/              # Isolated tests, all dependencies mocked
    integration/       # Tests with real dependencies (DB, services, network)
    property/          # fast-check / hypothesis property-based tests
    fixtures/          # Shared test data, factories, and builders
    helpers/           # Test utilities (createMemoryStorage, mockClock, etc.)
  vitest.config.ts     # Per-package Vitest configuration
```

**Naming conventions**:
- Test files: `{module}.test.ts` or `{module}.spec.ts`
- Fixture files: `{name}.fixture.ts`
- Helper files: `{name}.helper.ts`
- Property test files: `{module}.property.test.ts`

**Test isolation**: Each test file must be independently runnable. No implicit ordering. No shared mutable state between test files. Use `beforeEach` for setup, never `beforeAll` with mutation.

## Mock and Fixture Strategy

| Dependency Type | Mock Approach | When to Use Real | Shared Fixture |
|----------------|--------------|-----------------|----------------|
| PostgreSQL | In-memory repository implementing interface | Integration tests via testcontainers | `createTestDatabase()` in helpers/ |
| Redis | Map-based mock implementing cache interface | Integration tests via testcontainers | `createMemoryCache()` in helpers/ |
| NATS JetStream | EventEmitter-based mock | Integration tests via embedded NATS | `createTestBroker()` in helpers/ |
| HSM / Ed25519 signing | Deterministic key pair from seed | Never (use software signing in all tests) | `TEST_KEYPAIR` constant in fixtures/ |
| External HTTP APIs | MSW (Mock Service Worker) request handlers | E2E tests against staging | Per-service mock definitions in fixtures/ |
| Clock / time | Vitest `vi.useFakeTimers()` | Tests that do not depend on time | `advanceClock(ms)` helper |
| File system | memfs (in-memory filesystem) | Tests requiring real FS behavior | `createMemoryFS()` in helpers/ |
| Network state | Custom `NetworkSimulator` | Offline scenario tests only | `simulateOffline()`, `simulateReconnect()` |

**Rule**: If a test requires more than 3 mocks to set up, the module under test has too many dependencies. Refactor the module before writing the test.

**Factories**: Every domain entity (TradePass credential, GeoTag proof, GCI score, VaultMark custody record) has a factory function in `tests/fixtures/` that produces valid instances with sensible defaults. Tests override only the fields they care about.

## Security Testing

| Category | Scope | Method | Frequency |
|----------|-------|--------|-----------|
| Input validation | All API endpoints | OWASP Top 10 payloads: SQL injection, XSS, command injection, path traversal | Every PR |
| Sanitization | All user-facing inputs | Verify HTML stripping, SQL parameterization, XSS encoding | Every PR |
| Authentication boundaries | All protected routes | Expired tokens, invalid signatures, malformed JWTs, missing scopes | Every PR |
| Permission escalation | All role-gated operations | Attempt cross-role access, cross-jurisdiction access, privilege elevation | Every PR |
| Offline security | Mobile app, edge proxy | Tamper detection on local storage, secure credential caching, cache expiry | Every release |
| Dependency audit | All packages | Known CVE scanning via `npm audit` / `pip-audit` / Trivy | Daily + every PR |

Security tests use a dedicated test suite tag (`@security`) and can be run independently: `vitest run --tags security`.

## Accessibility Testing

| Requirement | Tool | Scope | Standard |
|-------------|------|-------|----------|
| Automated WCAG 2.1 AA | axe-core via @axe-core/react | All React components in gtcx-design/ui | Level AA conformance |
| Screen reader compatibility | Manual + automated label checks | All interactive components | ARIA roles and labels present |
| Keyboard navigation | Vitest + userEvent | All user flows (forms, modals, navigation) | Full keyboard operability |
| Color contrast | axe-core contrast checks | All text and interactive elements | 4.5:1 normal text, 3:1 large text |
| High-contrast mode | Visual regression in high-contrast | All components | No information lost in high-contrast |

Accessibility tests are part of the standard PR quality gate for gtcx-design. Components that fail axe-core checks cannot be merged.

## Offline Scenario Testing

| Scenario | Setup | Validates | Protocol Coverage |
|----------|-------|-----------|-------------------|
| L0 Complete offline | No network adapter; local storage only | All 6 protocols operate independently with local data | TradePass, GeoTag, GCI, VaultMark, PvP (queue), PANX (queue) |
| L1 Intermittent | Network available 10% of time (random drops) | Queue builds offline; sync completes on reconnect; no duplicates | Sync engine, event queue, deduplication |
| L2 Low-bandwidth | 10 kbps throttle | Compressed payloads, priority-based upload ordering, timeout handling | API client, sync engine, compression |
| L3 to L0 transition | Network drops mid-operation | Graceful degradation; partial uploads resume; no data loss | All protocols mid-operation |
| L0 to L3 transition | Network restored after extended offline | Backlog drains in priority order; conflict resolution completes | Sync engine, CRDT merge, queue drain |
| Conflict resolution | Concurrent offline edits from two devices | CRDT merge produces correct state; no silent data loss | Sync engine, CRDT layer |
| Clock skew | Device clock 24 hours ahead/behind | Timestamps normalized; verification validity unaffected | All protocols with time-dependent logic |

Offline tests use a custom `NetworkSimulator` helper that controls `navigator.onLine`, intercepts `fetch`, and simulates latency profiles. See `gtcx-app/packages/connectivity/tests/helpers/`.

## Test Data Management

| Aspect | Specification |
|--------|--------------|
| Generation | Factories produce deterministic test data from seeds; no production data in test suites |
| Isolation | Each test suite creates and destroys its own data; no shared database state between suites |
| Fixtures | Checked into version control in `tests/fixtures/`; reviewed like production code |
| Sensitive values | Test credentials use well-known test vectors (e.g., `TEST_PRIVATE_KEY`); never real keys |
| Snapshots | Vitest inline snapshots for complex output validation; reviewed on every change |
| Golden files | Protocol serialization tests compare output against golden files in `tests/fixtures/golden/` |

## Current State and Migration Path

The ecosystem currently has approximately 60 real assertions across 4 test files. This specification defines the target state. The migration path:

| Phase | Scope | Target | Timeline |
|-------|-------|--------|----------|
| Phase 1 | gtcx-core/crypto property tests | All 9 cryptographic invariants above | Immediate |
| Phase 2 | gtcx-core/security unit tests | 90% coverage on auth/authz | Following sprint |
| Phase 3 | gtcx-protocols/sdk-ts unit tests | 90% coverage on protocol SDK | Following sprint |
| Phase 4 | gtcx-platforms API integration tests | 80% coverage on NestJS services | 2 sprints |
| Phase 5 | gtcx-app offline scenario tests | All 7 scenarios above | 2 sprints |
| Phase 6 | gtcx-design accessibility tests | WCAG 2.1 AA compliance | Ongoing |

## Deep Dives

- [Resilience Framework](./resilience-framework.md) -- Degradation tiers and offline mode capabilities that drive offline test scenarios
- [CI/CD Pipeline](./cicd-pipeline.md) -- Pipeline stages, quality gates, and enforcement mechanisms
- [Security Policies](../security/policies-overview.md) -- Security policy framework informing security test requirements
- [PRINCIPLES.md](../../../docs/PRINCIPLES.md) -- P29: "Every module has automated tests" and the philosophical basis for test-first development
- [Infrastructure Architecture](../architecture/infrastructure-architecture-overview.md) -- Deployment topology informing integration and E2E test environments
