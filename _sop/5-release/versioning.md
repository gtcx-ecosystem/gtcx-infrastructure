# Versioning

## Standard

All packages follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html): `MAJOR.MINOR.PATCH`.

| Bump    | When                                      |
| ------- | ----------------------------------------- |
| `MAJOR` | Breaking change to any public API surface |
| `MINOR` | New capability, fully backward-compatible |
| `PATCH` | Bug fix, backward-compatible              |

## Monorepo Policy

Each package in `packages/` and `protocols/` is versioned independently. A change to one package does not require version bumps in unaffected packages.

Version bumps are determined by the highest-severity change merged since the last release:

- Any breaking change → MAJOR
- Any new feature, no breaking changes → MINOR
- Only fixes → PATCH

## Tagging

Release tags follow `vMAJOR.MINOR.PATCH` (e.g., `v3.1.0`). Tags are applied to `main` after the release workflow passes dry-run validation.

See `../2-docs/4-operations/runbooks/release.md` for the step-by-step release process.
