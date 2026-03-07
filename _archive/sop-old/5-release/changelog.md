# Changelog Conventions

## Location

`CHANGELOG.md` lives at the **repository root** alongside `README.md` and `LICENSE`.

This is a standing standard, not a preference. Root placement is required because:

- Changelog tooling (`conventional-changelog`, `release-please`, `changesets`) expects it there by default
- GitHub surfaces root-level markdown files automatically
- Downstream consumers and auditors expect it at the root per [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) convention

Do not move `CHANGELOG.md` to `_sop/`, `docs/`, or any subdirectory.

---

## Format

The changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Structure

```markdown
## [Unreleased]

### Added

- New capabilities

### Changed

- Changes to existing behavior

### Fixed

- Bug fixes

### Removed

- Removed capabilities

## [v1.2.0] - 2026-03-01

...
```

### Entry rules

- Every entry is written in imperative present tense: "Add X", not "Added X" or "Adds X"
- Breaking changes are prefixed: `**BREAKING:** Remove deprecated X`
- Entries are grouped by type: Added → Changed → Fixed → Removed → Security
- Each release section header links to the diff: `[v1.2.0]: https://github.com/.../compare/v1.1.0...v1.2.0`

---

## When to Update

| Event                    | Action                                                    |
| ------------------------ | --------------------------------------------------------- |
| Feature merged to `main` | Add entry under `[Unreleased] → Added`                    |
| Bug fix merged to `main` | Add entry under `[Unreleased] → Fixed`                    |
| Breaking change merged   | Add entry under `[Unreleased] → Changed`, prefix BREAKING |
| Release cut              | Promote `[Unreleased]` to `[vMAJOR.MINOR.PATCH] - date`   |

---

## Root-Level File Standards

The following files live at the repository root and must not be moved:

| File            | Purpose                                   |
| --------------- | ----------------------------------------- |
| `README.md`     | Repository entry point                    |
| `CHANGELOG.md`  | Release history (this document's subject) |
| `LICENSE`       | License declaration                       |
| `CLAUDE.md`     | Agent orientation and project rules       |
| `package.json`  | Monorepo manifest                         |
| `turbo.json`    | Build orchestration configuration         |
| `tsconfig.json` | TypeScript base configuration             |
| `Dockerfile`    | Container build definition                |

These files are authoritative at the root. Do not relocate them into subdirectories during hygiene or reorganization work.
