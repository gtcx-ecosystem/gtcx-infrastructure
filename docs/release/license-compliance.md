# License Compliance

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Last Reviewed**: {date}
**Reviewer**: {name}
**Release**: {version}

---

## License Policy

All third-party software used in this project must comply with the following policy:

| License Type             | Usage Permitted                      | Conditions                                     |
| ------------------------ | ------------------------------------ | ---------------------------------------------- |
| MIT                      | Yes — unrestricted                   | Attribution required                           |
| Apache 2.0               | Yes — unrestricted                   | Attribution + NOTICE file required             |
| BSD (2- and 3-clause)    | Yes — unrestricted                   | Attribution required                           |
| ISC                      | Yes — unrestricted                   | Attribution required                           |
| MPL 2.0                  | Yes — file-level copyleft only       | Modified files must remain MPL                 |
| LGPL                     | Conditional                          | Dynamic linking only; legal review required    |
| GPL (any version)        | No — prohibited in proprietary paths | Requires legal approval exception              |
| AGPL                     | No — prohibited                      | Requires legal approval exception              |
| CC BY                    | Yes — for content                    | Attribution required                           |
| CC BY-SA                 | Conditional                          | Share-alike requirement applies to derivatives |
| Proprietary / Commercial | Case-by-case                         | Contract required                              |

---

## Dependency Audit

Run before every release. Use the project's package manager to generate this list.

### Production Dependencies

```
# Generate with:
# npm: npx license-checker --production --csv > licenses.csv
# pnpm: pnpm licenses list
# python: pip-licenses --format=csv > licenses.csv
# rust: cargo license
```

| Package   | Version   | License      | Status       | Notes                     |
| --------- | --------- | ------------ | ------------ | ------------------------- |
| [package] | {version} | [MIT]        | ✅ Compliant |                           |
| [package] | {version} | [Apache 2.0] | ✅ Compliant |                           |
| [package] | {version} | [LGPL]       | ⚠️ Review    | Dynamic linking confirmed |

### Flagged Items

| Package   | Issue             | Resolution     | Owner  |
| --------- | ----------------- | -------------- | ------ |
| [package] | [License concern] | [Action taken] | [Name] |

---

## Attribution Requirements

The following packages require attribution in the product, documentation, or NOTICE file:

| Package   | License    | Attribution Text              |
| --------- | ---------- | ----------------------------- |
| [package] | MIT        | Copyright (c) [Year] [Author] |
| [package] | Apache 2.0 | See NOTICE file               |

**NOTICE file location**: `{path-to-NOTICE}`

---

## First-Party License

This project is licensed under: **[License Name]**

License file: `LICENSE`

---

## Sign-Off

| Role             | Name | Date | Status       |
| ---------------- | ---- | ---- | ------------ |
| Legal Counsel    |      |      | [ ] Approved |
| Engineering Lead |      |      | [ ] Approved |

---

_Review cycle: before every major release. Update when adding new dependencies._
