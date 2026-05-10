# Dependency Boundaries

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

Purpose: define which dependency sources are allowed, which are prohibited, and the review rules for exceptions.

## Approved Sources

- Official registries (npm, PyPI, Maven, crates.io, etc.)
- Vendor supported distributions
- Internal registries with vetted packages

## Prohibited Sources

- Unmaintained libraries with no release in the last 18 months
- Direct GitHub dependencies without a pinned tag or commit
- Libraries with critical unpatched CVEs
- Licenses incompatible with commercial distribution (GPL/AGPL) without legal approval

## Supply Chain Requirements

- Lockfiles are mandatory and must be committed.
- SBOM generation is required for production builds.
- Dependencies must be pinned to exact versions in production.

## Review Checklist

- Security posture (CVEs, maintainer activity)
- License compatibility
- Compatibility with supported runtime versions
- Operational impact (size, performance, build time)

## Ownership

Owner: Platform Lead  
Review cadence: quarterly

---
