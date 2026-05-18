---
title: 'ADR-001: Structured Error Taxonomy'
status: 'current'
date: '2026-05-12'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['architecture', 'infrastructure', 'api', 'frontend', 'backend']
review_cycle: 'on-change'
---

# ADR-001: Structured Error Taxonomy

**Status:** Accepted
**Date:** February 2026

---

## Context

The codebase needed a consistent error handling strategy across all packages and protocols. Without one, modules were using ad-hoc error classes, bare `throw new Error()`, and inconsistent error codes. This made it hard to:

1. Programmatically distinguish error types in consumers
2. Provide consistent error messages to API callers
3. Map errors to appropriate HTTP status codes in the SDK

---

## Decision

We adopted a structured error taxonomy with `GtcxError` as the base class in `@gtcx/protocols-domain`, and domain-specific subclasses:

**`GtcxError`** — Base error with `code: string` and `context?: Record<string, unknown>`

**`StubNotAllowedError`** — Thrown when in-memory stubs are used in production (via `enforceStubGuard`)

**`invalidArg()`** — Factory function in `@gtcx/validators` for argument validation errors; returns a `GtcxError` with structured context

**`GTCXError`** — SDK-level error with `status: number` and `code?: string` for HTTP error mapping

All validation errors use `invalidArg()` with descriptive messages and optional context objects. Protocol-level handlers validate inputs via `ensureSchema()`, which throws structured errors on failure.

---

## Consequences

**Positive:**

- Consumers can catch specific error types and react programmatically
- Error context (field names, schema IDs, validation errors) is always available
- SDK maps server errors to typed `GTCXError` with HTTP status codes
- No silent failures — all invalid states are surfaced immediately

**Negative:**

- Adding new error types requires updating taxonomy documentation
- Some legacy test utilities still use bare `Error` (acceptable)

**Neutral:**

- Error serialization for logging uses `message + context` pattern consistently

---

## Alternatives Considered

- **HTTP error codes only** — Insufficient for internal protocol error handling; loses semantic meaning
- **Custom error per protocol** — Leads to proliferation of incompatible error types across packages
- **Result types (Either/Result)** — Not idiomatic in the TypeScript/Node ecosystem; adds friction for callers
