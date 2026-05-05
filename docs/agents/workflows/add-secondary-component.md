# Task Playbook: Add a Secondary-Language Component

**Owner:** DevOps/SRE Engineer or Infrastructure Security Engineer (depending on component type)
**Safety tier:** Requires human approval before proceeding

---

## When to Run This

Run when a new component in a secondary language (e.g. Rust, Go, Python) is being added to the workspace. This covers:

- New performance-critical or safety-critical components
- New native binding targets
- New runtime or infrastructure components

Do not begin until human approval is confirmed. All secondary-language component additions require explicit approval.

---

## Pre-Flight

Confirm with the human reviewer:

- Component name and naming convention
- Type: {e.g. cryptographic / native binding / network / data processing}
- Whether it exposes bindings to the primary language (affects integration surface)
- Whether it introduces a new security or compliance boundary

Then read:

- `docs/5-specs/4-backend/packages/{secondary-dir}/README.md` — existing component inventory
- Any ADR governing why this secondary language is used and what it covers
- The relevant component spec if the new component extends an existing one
- `docs/agents/workflows/safety-rules.md`

---

## Steps

### 1. Write the component spec

Before creating any code, write the component spec at:

```
docs/5-specs/4-backend/packages/{secondary-dir}/{component-name}.md
```

The spec must include:

- Purpose and responsibility
- Algorithms or protocols used (if applicable) — reference standards and approval status
- Binding surface to primary language (if applicable)
- Performance budget targets
- Test requirements and test vector sources (if applicable)
- Dependencies — justify each one

---

### 2. Write an ADR if the component establishes a new protocol boundary

If the component introduces a new algorithm, a new binding contract, or a new security boundary, write an ADR before any code. See `docs/agents/workflows/tasks/write-adr.md`.

---

### 3. Scaffold the component

Minimum required files:

```
{secondary-dir}/{component-name}/
  {manifest-file}     — name, version
  src/{entry}         — public API
  tests/              — integration tests
  benches/            — if performance-sensitive
```

Requirements:

- No unnecessary dependencies — every dep must be justified in the spec
- Feature flags documented if used

---

### 4. Update the workspace manifest

Add the new component to the workspace members array.

---

### 5. If the component exposes bindings to the primary language

Coordinate with the owner of the binding layer. The binding surface must be reviewed before any binding is exposed. Update the relevant spec to document the new binding dependency.

---

### 6. Update the component spec index

Add the new component to `docs/5-specs/4-backend/packages/{secondary-dir}/README.md`.

---

### 7. Update the spec-to-code traceability matrix

Add an entry in `docs/compliance/spec-to-code-traceability.md`.

---

### 8. Run component gates

Run from the component directory. For shell scripts:

```bash
shellcheck {component-name}.sh
```

For Python automation scripts:

```bash
uv run pytest tests/
ruff check src/
mypy src/
```

---

### 9. Run full workspace gates

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Post-Flight

- [ ] Component spec exists at the correct path
- [ ] ADR exists if a new boundary was established
- [ ] Component listed in spec index
- [ ] Workspace manifest updated
- [ ] All component gates pass
- [ ] All workspace gates pass
- [ ] Traceability matrix updated

---

## Hard Rules

- Never add a security-critical component without the designated security role co-owning from day one
- Never use an unaudited library for security-critical operations
- Never expose a binding without review of the interface surface
- Never add a component without prior human approval

---

## Reference

- [`docs/5-specs/4-backend/packages/`](../../../2-docs/5-specs/4-backend/packages/) — component specifications
- [`docs/engineering/6-decisions/`](../../../2-docs/3-engineering/6-decisions/) — ADR index
- [`docs/agents/workflows/tasks/write-adr.md`](./write-adr.md) — ADR workflow
- [`docs/agents/workflows/safety-rules.md`](../safety-rules.md) — approval requirements
