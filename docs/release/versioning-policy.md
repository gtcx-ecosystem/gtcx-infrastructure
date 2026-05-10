# Versioning Policy

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

---

## Version Scheme

This project follows [Semantic Versioning 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`

| Segment   | When to increment                                                                | Example |
| --------- | -------------------------------------------------------------------------------- | ------- |
| **MAJOR** | Breaking changes — API incompatibility, removed features, major behavior changes | `2.0.0` |
| **MINOR** | New features that are backwards-compatible                                       | `1.3.0` |
| **PATCH** | Backwards-compatible bug fixes and security patches                              | `1.3.1` |

**Pre-release identifiers:**

| Tag     | Meaning                            | Example         |
| ------- | ---------------------------------- | --------------- |
| `alpha` | Internal testing, unstable         | `1.4.0-alpha.1` |
| `beta`  | External testing, feature-complete | `1.4.0-beta.2`  |
| `rc`    | Release candidate, no new features | `1.4.0-rc.1`    |

---

## Release Naming Conventions

| Release Type         | Format                                 | Example          |
| -------------------- | -------------------------------------- | ---------------- |
| General availability | `vMAJOR.MINOR.PATCH`                   | `v1.4.0`         |
| Alpha                | `vMAJOR.MINOR.PATCH-alpha.N`           | `v1.4.0-alpha.1` |
| Beta                 | `vMAJOR.MINOR.PATCH-beta.N`            | `v1.4.0-beta.1`  |
| Release candidate    | `vMAJOR.MINOR.PATCH-rc.N`              | `v1.4.0-rc.1`    |
| Hotfix               | `vMAJOR.MINOR.PATCH` (patch increment) | `v1.4.1`         |

---

## Breaking Change Policy

A change is **breaking** if it:

- Removes or renames a public API endpoint, field, or type
- Changes the behavior of an existing API in a way that existing callers cannot handle without modification
- Changes a required authentication method
- Removes a supported platform, runtime version, or environment
- Changes default behavior in a way that could cause data loss or incorrect results

**Process for breaking changes:**

1. Deprecate the old behavior in a MINOR release with documentation and `@deprecated` markers
2. Maintain the deprecated behavior for a minimum of {n} MINOR releases or {n} months
3. Remove in the next MAJOR release
4. Document in CHANGELOG under `### Breaking Changes`

---

## Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/) conventions.

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Breaking Changes

- [Change] — Migration: [what users must do]

### Added

- [New feature or endpoint]

### Changed

- [Behavior change or improvement]

### Deprecated

- [Feature being phased out, removal target version]

### Removed

- [Features removed in this release]

### Fixed

- [Bug fix]

### Security

- [Security fix] — CVE-YYYY-NNNNN if applicable
```

---

## Version Lifecycle

| Phase       | Duration       | Support Level                           |
| ----------- | -------------- | --------------------------------------- |
| Active      | Current MAJOR  | Full support — bugs, security, features |
| Maintenance | Previous MAJOR | Security patches only                   |
| End of Life | Older          | No support                              |

**EOL Notice**: Announce end-of-life dates at least {n} months in advance via release notes and email notification to affected customers.

---

## Git Tagging

All releases are tagged in Git:

```bash
# Create and push release tag
git tag -a v1.4.0 -m "Release v1.4.0"
git push origin v1.4.0
```

Tag naming: `v{MAJOR}.{MINOR}.{PATCH}` — always prefixed with `v`.

---

## Release Branch Strategy

| Branch                 | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `main`                 | Production-ready code; tagged for releases |
| `release/{version}`    | Stabilization branch for RC phase          |
| `hotfix/{description}` | Emergency patches against tagged release   |

---

_Review this policy when adopting a new platform, changing API stability guarantees, or onboarding enterprise customers with SLA requirements._
