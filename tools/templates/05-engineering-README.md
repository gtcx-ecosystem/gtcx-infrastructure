# Engineering Standards

> **The 30 principles, code standards, and development practices that define GTCX**


## Core Documents

| Document | Purpose |
|----------|---------|
| [PRINCIPLES.md](./PRINCIPLES.md) | **The 30 Engineering Principles** — Start here |
| [PRINCIPLE-INDEX.md](./PRINCIPLE-INDEX.md) | Quick reference index |
| [CODE-STANDARDS.md](./CODE-STANDARDS.md) | Code style and quality requirements |
| [RED-FLAGS.md](./RED-FLAGS.md) | Anti-patterns and common mistakes |
| [DEVELOPER-MANIFESTO.md](./DEVELOPER-MANIFESTO.md) | Philosophy and culture |
| [DEPLOYMENT-STRATEGY.md](./DEPLOYMENT-STRATEGY.md) | Release and deployment practices |


## The 30 Principles (Summary)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GTCX 30 PRINCIPLES                               │
│                         (5 × 6 Categories)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔐 TRUST              🏛️ SOVEREIGNTY         ⚙️ ARCHITECTURE           │
│  ───────────────       ────────────────       ────────────────          │
│  1. PROOF              6. SOVEREIGN           11. SECURE                │
│  2. PRIVATE            7. OPEN                12. RESILIENT             │
│  3. AUDITABLE          8. FEDERATED           13. MODULAR               │
│  4. IMMUTABLE          9. GOVERNED            14. DEPLOYABLE            │
│  5. TRANSPARENT       10. COMPLIANT           15. OBSERVABLE            │
│                                                                         │
│  🌍 FRONTIER           🔄 SCALE               🧭 CRAFT                  │
│  ────────────────      ──────────────         ──────────────            │
│  16. UBUNTU            21. UNIVERSAL          26. RESEARCHED            │
│  17. OFFLINE           22. PORTABLE           27. DOCUMENTED            │
│  18. LOCALIZED         23. INTEROPERABLE      28. ADAPTIVE              │
│  19. ACCESSIBLE        24. SCALABLE           29. TESTED                │
│  20. HARDWARE          25. EXTENSIBLE         30. INTENTIONAL           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Full details:** [PRINCIPLES.md](./PRINCIPLES.md)


## Code Standards Quick Reference

### TypeScript
- **Strict mode** always (`"strict": true`)
- **Zod schemas** at all boundaries
- **Explicit types** for public APIs

### Rust
- **All cryptography** lives in `rust/gtcx-crypto/`
- **No unsafe** without documented justification
- **Clippy clean** with `#![deny(warnings)]`

### Testing
- **Unit tests** for business logic
- **Integration tests** for API boundaries
- **Property tests** for cryptographic operations

### Documentation
- **Every public API** must have JSDoc/rustdoc
- **Every directory** must have README.md
- **Architecture decisions** must have ADRs


## Decision Test

Before committing code, ask:

1. **Does this align with the 30 principles?**
2. **Would this pass code review with RED-FLAGS.md?**
3. **Is this documented?**
4. **Is this tested?**

If any answer is "no" — fix it first.


## Related Documentation

- [Architecture Decisions](../02-architecture/decisions/)
- [Protocol Specification](../../gtcx-protocol-docs/)
- [Test Vectors](../../gtcx-protocol-docs/TEST-VECTORS.md)
