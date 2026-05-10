# Task Playbook: Add an Infrastructure Component

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Owner:** DevOps engineer (design) + Lead engineer (approval)
**Safety tier:** Requires human approval before proceeding

---

## When to Run This

Run when adding a new infrastructure component to the repo — a new Terraform module, Kubernetes service, Docker service, Node.js automation script, or database migration.

"Adding a component" in this repo means adding infrastructure that will be applied to shared environments. Every new component modifies shared state and requires review before being applied.

Do not begin implementation until human approval is confirmed. Components that modify shared environments are approval-required changes.

---

## Pre-Flight

Confirm with the human reviewer:

- Component type: Terraform module / K8s manifest / Docker service / Node.js script / migration
- Responsibility: what this component does that no existing component does
- Environment scope: development only / staging / production
- Security surface: does this component handle secrets, network access, database access, or IAM?
- Whether the `gtcx_audit` database is involved (any involvement requires security review)

Then read:

- `docs/engineering/2-system-design/overview.md` — environment topology and database separation rules
- `docs/agents/workflows/safety-rules.md` — three-tier authority structure

---

## Steps

### 1. Write the component spec (if structural)

If the new component introduces a new service, database, network boundary, or deployment target, write a brief spec:

```
docs/5-specs/infrastructure/{component-name}.md
```

The spec must include:

- Purpose and responsibility
- Environment scope (which environments it runs in)
- Security surface (secrets, IAM, network access)
- Dependencies (what other services it depends on)
- Observability: what metrics/logs it emits

---

### 2. Write an ADR if the component changes infrastructure topology

If the new component introduces a new service boundary, a new database, a new cloud resource type, or a new network zone, write an ADR before any code. See `docs/agents/workflows/tasks/write-adr.md`.

---

### 3. Implement the component

Follow the pattern of existing components in the same category:

**Terraform module:**

```
modules/{name}/
  main.tf
  variables.tf
  outputs.tf
  README.md
```

**Kubernetes manifest:**

```
k8s/{service-name}/
  deployment.yaml
  service.yaml
  configmap.yaml   — non-sensitive config only; no secrets in yaml
```

**Docker service:**

```
# Add service to docker-compose.yml
# Never hardcode credentials — use environment variables or secret manager references
```

**Node.js automation script:**

```
tools/{name}.mjs
# Add to package.json scripts
```

**Database migration:**

```
# Add sequential migration file
# Never modify migrations that have already run in any environment
# Never touch gtcx_audit in application migrations
```

---

### 4. No hardcoded secrets — ever

All credentials, API keys, and tokens must be injected via environment variables or a secrets manager. Never committed. If a secret was accidentally committed, rotate it before proceeding.

---

### 5. Run all CI gates

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

If Docker changes:

```bash
docker compose build
```

If Terraform changes:

```bash
terraform init && terraform validate && terraform plan
```

All gates must pass before the component is considered ready for review.

---

## Post-Flight

- [ ] Component spec exists (if structural)
- [ ] ADR exists if topology was changed
- [ ] All CI gates pass
- [ ] No secrets in committed files
- [ ] Human approval confirmed for shared environment apply
- [ ] `terraform plan` or `kubectl diff` output reviewed before apply

---

## Hard Rules

- Never add a component without prior human approval for environment apply
- Never hardcode secrets, credentials, or API keys
- Never modify a migration that has already run in any environment
- Never allow a new component to directly access `gtcx_audit` without explicit security review
- Never apply changes to production without staging verification first

---

## Reference

- [`docs/engineering/6-decisions/`](../../decisions) — ADR index
- [`docs/agents/workflows/tasks/write-adr.md`](./write-adr.md) — ADR workflow
- [`docs/agents/workflows/safety-rules.md`](agent-safety-rules.md) — approval requirements
