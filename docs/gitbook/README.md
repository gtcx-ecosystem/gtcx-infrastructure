---
title: 'GitBook'
status: 'current'
date: '2026-05-02'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'api', 'frontend']
review_cycle: 'quarterly'
---

# GitBook

External-facing documentation published to GitBook. This section contains the public protocol documentation — quickstarts, integration guides, governance, and API reference.

## Contents

| Document                                     | Description                                                      | Audience                   |
| -------------------------------------------- | ---------------------------------------------------------------- | -------------------------- |
| [quickstart.md](quickstart.md)               | Get started with the GTCX Protocol SDK in under 10 minutes       | External developers        |
| [integration-guide.md](integration-guide.md) | Full integration walkthrough — identity, provenance, settlement  | Platform integrators       |
| [governance.md](governance.md)               | Network governance, validator participation, protocol versioning | Institutional participants |

## Publishing

This folder is the source for the external GitBook publication. Files here are written for an external audience — buyers, platform builders, government integrators, and institutional validators.

**Important distinctions:**

- Documents here must not contain internal implementation detail, security findings, or operational procedures
- Internal engineering reference stays in `../3-engineering/`
- Compliance and audit detail stays in `../4-operations/`

## What Belongs Here

- Protocol quickstarts for external developers
- SDK integration walkthroughs for platform builders
- Public governance documentation
- External-facing API reference

## What Does NOT Belong Here

- Internal engineering standards → `../3-engineering/`
- Security threat models → `../3-engineering/security/`
- Operational runbooks → `../4-operations/`
- Internal compliance controls → `../4-operations/compliance/`
