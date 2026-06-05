# Changelog

All notable changes to this catalog will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this catalog adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-05-30

### Added

- **Ed25519 signing.** `jurisdictions.json.sig` ships alongside the catalog;
  the package now publishes with a tamper-evident signature consumers can
  verify with `node 03-platform/scripts/verify-catalog.mjs` (no external deps).
- **Versioning policy.** README documents the patch/minor/major contract
  consumers can rely on for compliance-logic updates.
- **Citation file** (`CITATION.cff`) for academic and regulatory citation.

### Catalog content

- 11 jurisdictions: zimbabwe, south_africa, botswana, mozambique, zambia,
  kenya, uganda, tanzania, rwanda, nigeria, ghana.
- Per-jurisdiction: region, KYC retention (days), audit retention (days),
  regulator + full name, data protection law + authority, cross-border
  conditions, currency, notes.

## [1.0.0] — Initial catalog

Initial 11-jurisdiction catalog released as an internal workspace package.
