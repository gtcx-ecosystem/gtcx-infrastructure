# Task: Write an ADR

Role: Protocol Architect (propose) / Any role (propose) — human approval required to Accept

---

## When to Write an ADR

Write an ADR when a decision:

- Affects multiple packages or protocols
- Was non-obvious — reasonable engineers would have made a different choice
- Has architectural consequences future engineers need to understand
- Cannot be understood from the code alone

Do not write ADRs for:

- Style or formatting decisions
- Implementation details that are self-evident from the code
- Decisions that were immediately obvious and uncontroversial

---

## Steps

### 1. Copy the template

```bash
cp _sop/2-docs/1-architecture/decisions/template.md \
   _sop/2-docs/1-architecture/decisions/NNN-short-title.md
```

Use the next sequential number in the index.

### 2. Fill in the ADR

```markdown
# ADR-NNN: Title

**Status:** Proposed
**Date:** YYYY-MM-DD
**Authors:** [role or name]

## Context

[What situation or problem required a decision?
What constraints existed? What options were on the table?]

## Decision

[What was decided, in precise terms.
State the decision, not the rationale. The rationale goes in the next section.]

## Rationale

[Why this option over the alternatives?
What tradeoffs were accepted?]

## Consequences

**Positive:**

- [What gets better]

**Negative / tradeoffs:**

- [What gets harder or is given up]

**Neutral:**

- [Changes that are neither good nor bad — just different]

## Alternatives Considered

### Option A — [name]

[Brief description. Why it was not chosen.]

### Option B — [name]

[Brief description. Why it was not chosen.]
```

### 3. Add to the ADR index

Update `_sop/2-docs/1-architecture/decisions/README.md`:

```markdown
| [NNN](NNN-short-title.md) | Title | Proposed |
```

Status stays `Proposed` until a human marks it `Accepted`.

### 4. Reference the ADR from affected code or docs

If the ADR explains a pattern that appears in code, add a comment:

```typescript
// See ADR-NNN: Short Title
enforceStubGuard('protocol.handler');
```

If the ADR affects a spec, reference it in `protocols/<protocol>/SPEC.md`:

```markdown
See [ADR-NNN](../../_sop/2-docs/1-architecture/decisions/NNN-title.md) for the decision rationale.
```

### 5. Human approval

Present the Proposed ADR to the human for review. Only a human can change status from `Proposed` to `Accepted`.

Do not proceed with implementation changes described in the ADR until it is `Accepted`.

---

## ADR Status Lifecycle

```
Proposed → Accepted → Deprecated (if superseded)
         → Rejected
```

---

## Reference

- [ADR template](../../2-docs/1-architecture/decisions/template.md)
- [ADR index](../../2-docs/1-architecture/decisions/README.md)
