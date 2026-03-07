# Architectural Decision Records

ADRs document significant architecture decisions — what was decided, why, and what alternatives were considered.

## Index

| ADR                                 | Title                     | Status   |
| ----------------------------------- | ------------------------- | -------- |
| [001](001-error-taxonomy.md)        | Structured Error Taxonomy | Accepted |
| [002](002-in-memory-stub-guards.md) | In-Memory Stub Guards     | Accepted |

## Template

Use [template.md](template.md) for new ADRs.

## What Belongs Here

Decisions that:

- Affected multiple packages or protocols
- Were non-obvious (reasonable engineers would have made a different choice)
- Have architectural consequences that future engineers need to understand
- Cannot be understood from the code alone

## What Does NOT Belong Here

- Implementation details that are self-evident from the code
- Style or formatting decisions
- Decisions that were immediately obvious and uncontroversial
