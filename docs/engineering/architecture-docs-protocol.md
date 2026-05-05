# Protocol: Architecture Documentation

## Version

1.0

## Summary

Defines the minimum architecture documentation required for any system or service.

## Required Documents

| Document                | Required When                      | Location                         |
| ----------------------- | ---------------------------------- | -------------------------------- |
| System design           | Any multi-component system         | `docs/architecture/`             |
| ADR                     | Any significant technical decision | `docs/architecture/decisions/`   |
| Data model              | Persistent data is introduced      | `docs/architecture/data-models/` |
| Deployment architecture | First production deployment        | `docs/architecture/deployment/`  |
| Monitoring              | Production monitoring is enabled   | `docs/architecture/monitoring/`  |

## ADR Rules

- One ADR per decision
- ADRs are immutable once accepted
- Supersede with a new ADR, do not edit old ADRs

## Quality Bar

- Diagrams reflect actual system boundaries
- Decisions include alternatives and trade-offs
- Security and reliability assumptions are explicit

## Reference

- [ADR Template](../6-decisions/adr-template.md)
- [System Design Template](./system-design-template.md)

## Metadata

- **Owner**: Architecture Lead
- **Effective Date**: [YYYY-MM-DD]
- **Last Reviewed**: [YYYY-MM-DD]
- **Next Review**: [YYYY-MM-DD]
