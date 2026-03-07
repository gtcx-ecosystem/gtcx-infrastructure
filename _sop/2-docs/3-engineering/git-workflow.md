# Git Workflow

Branching model, commit standards, PR process, and release tagging for the GTCX Protocol monorepo.

---

## Branching Model

GTCX uses **trunk-based development** with short-lived feature branches off `main`.

- `main` is always deployable. No broken builds, no failing tests on main.
- Feature branches live for days, not weeks. Long-lived branches signal a design problem.
- No long-lived `develop` or `staging` branches.

---

## Branch Naming

| Prefix     | Use                                      |
| ---------- | ---------------------------------------- |
| `feature/` | New functionality                        |
| `fix/`     | Bug fixes                                |
| `chore/`   | Maintenance, dependency updates, tooling |
| `release/` | Release preparation and version tagging  |

**Format:** `{prefix}/{short-description}` — lowercase, hyphen-separated.

Examples:

- `feature/tradepass-did-rotation`
- `fix/pvp-escrow-double-release`
- `chore/update-zod-dependency`

---

## Commit Standards

Commits follow **Conventional Commits** format:

```
type(scope): description
```

### Types

| Type       | Use                                                     |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `chore`    | Build, tooling, dependency updates                      |
| `docs`     | Documentation only                                      |
| `test`     | Test additions or fixes                                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `ci`       | CI/CD changes                                           |

### Rules

1. **Atomic commits** — each commit is a single logical change that compiles and passes tests.
2. **Present tense, lowercase** — `add feature` not `Added feature`.
3. **No WIP commits on main** — squash or fixup before merging.
4. **Scope is optional** — use the protocol or package name when helpful: `feat(tradepass): add did rotation`.

---

## Pull Request Process

### Opening a PR

1. Create a PR with a clear title following the Conventional Commits format.
2. Link related issues using GitHub keywords (`closes #123`, `fixes #456`).
3. Request review from at least one team member.
4. All CI checks must pass before merge is allowed.
5. **Squash merge to main** — keeps history clean. Each PR becomes one commit.

### PR Description Must Include

```markdown
## What

[Summary of the change — what was added, changed, or removed]

## Why

[Motivation — link to issue or explain the problem]

## How

[Brief technical approach — only if non-obvious]

## Testing

[What was tested manually or automatically]
```

---

## Code Review

- **Minimum 1 approval** required before merge.
- **Review within 24 hours** — do not block teammates.
- **Review the tests**, not just the implementation.
- Constructive feedback: suggest with reasoning, link to docs or standards when citing a rule.
- Approving a PR means you are confident the code is correct, secure, and tested.

---

## Merge Strategy

| Branch Type            | Merge Strategy                                             |
| ---------------------- | ---------------------------------------------------------- |
| Feature / fix branches | **Squash merge** — collapses into one clean commit on main |
| Release branches       | **Merge commit** — preserves the release branch history    |

---

## Release Process

1. **Tag from main** — all releases are cut from the main branch.
2. **Semantic versioning** — `vMAJOR.MINOR.PATCH` (e.g., `v2.1.0`).
3. **Release notes required** — GitHub Releases with changelog summary covering changes, fixes, and any breaking changes.
4. **No hotfixes to old versions** unless explicitly maintaining an LTS branch.

### Versioning Rules

| Change                              | Version Bump                                     |
| ----------------------------------- | ------------------------------------------------ |
| Breaking API change                 | MAJOR                                            |
| New backward-compatible feature     | MINOR                                            |
| Bug fix, performance, documentation | PATCH                                            |
| Schema breaking change              | MAJOR — see `data-models.md` §6 migration policy |

---

## Protections on `main`

- Direct pushes to `main` are blocked.
- All CI checks must pass: TypeScript, ESLint, Vitest, Ruff (Python).
- Minimum 1 PR approval required.
- No force pushes.

---

## Reference

- [code-standards.md](code-standards.md)
- [testing.md](testing.md)
