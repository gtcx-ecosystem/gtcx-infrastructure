# Guide: Hygiene Cadence

Recommended cadence and ownership for ongoing repository hygiene.

## Ownership

- **Primary owner:** Repo maintainer
- **Secondary owner:** Engineering lead or platform owner

## Cadence

| Cadence   | Activity                                  | Template                                                                  |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| Weekly    | Dependency review, open PR cleanup        | `dependency-hygiene.md`                                                   |
| Monthly   | Docs review, folder cleanup, naming check | `documentation-hygiene.md`, `folder-hygiene.md`, `file-naming-hygiene.md` |
| Quarterly | Security review, access audit             | `security-hygiene.md`                                                     |

## Triggers (Out-of-band)

Run a hygiene check when:

- A major release ships
- A repo is reorganized
- A new team inherits a repo
- A security incident occurs

## Reference

- [Hygiene Templates](../templates/README.md)

## Metadata

- **Owner**: Platform Operations
- **Effective Date**: 2026-03-01
- **Last Reviewed**: 2026-03-01
- **Next Review**: 2026-09-01
