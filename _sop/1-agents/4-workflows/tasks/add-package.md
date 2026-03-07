# Task Playbook: Add a Package

**Owner:** {role-name} (design) + {role-name} (gates)
**Safety tier:** Requires human approval before proceeding

---

## When to Run This

Run when a new package or module is being added to the workspace. This playbook covers the full lifecycle from approval through CI-passing state.

Do not begin implementation until human approval is confirmed. Adding a package modifies `{workspace-config-file}`, which is an approval-required file.

---

## Pre-Flight

Confirm with the human reviewer:

- Package name and scope
- Responsibility: what this package does that no existing package does
- Dependency direction: what it may import from, what may import from it
- Whether it is security-sensitive (if yes: security role must be involved from the start)

Then read:

- `_sop/2-docs/5-specs/4-backend/core-spec.md` — confirm the new package is within scope
- `_sop/2-docs/3-engineering/2-system-design/overview.md` — confirm the dependency direction is valid
- `_sop/1-agents/4-workflows/safety-rules.md`

---

## Steps

### 1. Write the package spec

Before creating any code, write the package spec at:

```
_sop/2-docs/5-specs/4-backend/packages/{package-name}.md
```

The spec must include:

- Purpose and responsibility
- What it may depend on (imports allowed)
- What may depend on it (downstream consumers)
- Public API surface (exports)
- Error types and taxonomy
- Test requirements

---

### 2. Write an ADR if the package changes architectural boundaries

If the new package introduces a new layer, a new dependency direction, or a new cross-package contract, write an ADR before any code. See `_sop/1-agents/4-workflows/tasks/write-adr.md`.

---

### 3. Scaffold the package

```bash
mkdir -p {packages-dir}/{name}/src
```

Minimum required files:

```
{packages-dir}/{name}/
  package.json          — name, version
  tsconfig.json         — extends root tsconfig
  src/index.ts          — public exports only
  src/{name}.ts         — implementation
  tests/{name}.test.ts  — tests
  README.md             — package description and usage
```

`package.json` must include:

- Entry point fields (`main`, `types`, `exports`)
- All internal dependencies declared — no phantom dependencies
- `"private": false` if publishable; `"private": true` if internal only

---

### 4. Update `{workspace-config-file}`

Add the new package. Human approval confirmed in pre-flight covers this step.

---

### 5. Update build configuration if the package has build outputs

Add the package's build pipeline if it differs from the default.

---

### 6. Update boundary enforcement tooling

If the repo enforces dependency boundaries via tooling, update the new package's allowed dependency set. Do not grant broader permissions than the spec allows. Requires human approval.

---

### 7. Update the spec-to-code traceability matrix

Add an entry in `_sop/2-docs/3-engineering/5-compliance/spec-to-code-traceability.md` mapping the new package spec to its implementation module.

---

### 8. Update indexes

- `_sop/2-docs/3-engineering/6-decisions/README.md` — if an ADR was written
- `_sop/2-docs/5-specs/4-backend/packages/README.md` — add the new package

---

### 9. Run all gates

```bash
{architecture-check-command}
{lint-command}
{typecheck-command}
{test-command}
{build-command}
```

All gates must pass before the package is considered complete.

---

## Post-Flight

- [ ] Package spec exists at `_sop/2-docs/5-specs/4-backend/packages/{name}.md`
- [ ] ADR exists if architectural boundary was changed
- [ ] All CI gates pass
- [ ] `{workspace-config-file}` updated (with prior human approval)
- [ ] Boundary enforcement tooling updated (with prior human approval)
- [ ] Traceability matrix updated
- [ ] Package spec index updated

---

## Hard Rules

- Never add a package without prior human approval
- Never create a package that violates the established dependency graph
- Never publish a package that has not passed all CI gates
- Never allow a new package to create a circular dependency

---

## Reference

- [`_sop/2-docs/5-specs/4-backend/core-spec.md`](../../../2-docs/5-specs/4-backend/core-spec.md) — scope and constraints
- [`_sop/2-docs/3-engineering/6-decisions/`](../../../2-docs/3-engineering/6-decisions/) — ADR index
- [`_sop/1-agents/4-workflows/tasks/write-adr.md`](./write-adr.md) — ADR workflow
- [`_sop/1-agents/4-workflows/safety-rules.md`](../safety-rules.md) — approval requirements
