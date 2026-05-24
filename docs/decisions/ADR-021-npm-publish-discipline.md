---
title: 'ADR-021: npm Publish Discipline + Supply-Chain Roadmap'
status: 'accepted'
date: '2026-05-24'
owner: 'platform-engineering'
role: 'security-architect'
tier: 'standard'
tags: ['architecture', 'security', 'supply-chain', 'distribution', 'npm']
review_cycle: 'on-change'
---

# ADR-021: npm Publish Discipline + Supply-Chain Roadmap

## Status

Accepted

## Date

2026-05-24

## Context

`@gtcx/audit-signer@0.1.0` was published to npm on 2026-05-22 as the first GTCX npm publication. The publish exposed a short-term supply-chain risk that is worth codifying as repo policy before the next publish (whether that's `v0.1.1` of audit-signer or the first publication of `@gtcx/compliance-gateway-mcp`).

The risk: a compromised npm credential or a CI escape with publish rights could push a malicious `v0.1.x` that backdoors `verifyChain`, `signRecord`, or `createRecord`. Every downstream consumer would unknowingly use the backdoored version on their next `npm install`. The blast radius is wider than just GTCX because the package is published publicly.

Per `docs/security/threat-model-2026-05.md` T-4 the partial mitigation is GitHub Security Advisories + manual deprecation. That's reactive, not preventive. This ADR codifies the preventive controls.

## Decision

The repo follows a four-rule npm publish discipline:

### Rule 1: Granular access tokens only

All npm publishes use granular access tokens scoped to the specific package, with "Bypass 2FA" enabled. Account-wide tokens are not used and are not generated. Tokens have a 90-day expiration; rotation is tracked in `docs/security/credential-rotation-log.md`.

### Rule 2: Publish from a clean checkout

A publish happens only from a git working tree that:

- has zero uncommitted changes (`git status --porcelain` returns empty)
- is on the default branch (`main`)
- is at the exact commit of the semver tag being published (`git describe --exact-match HEAD` returns the version tag)

The `prepublishOnly` script in every publishable `package.json` runs the full test suite. A failed test blocks publish.

### Rule 3: Atomic version bump + tag + publish

A publish is a single atomic operation:

```bash
pnpm -F @gtcx/<pkg> version <patch|minor|major>
git push --tags origin main
pnpm -F @gtcx/<pkg> publish --access public --otp=<6-digit>
```

If any step fails, the previous step is rolled back before the next attempt. Half-published versions (tag pushed but npm publish failed, or vice versa) are explicitly forbidden.

### Rule 4: Sigstore signing on the next minor release (P1 backlog)

Starting with the next minor release of any published package, `npm publish --provenance` ships SLSA L3 provenance to the npm registry. The first publication that includes provenance flips the rule from "P1 backlog" to "mandatory."

The provenance attestation lets external consumers verify the package was built from the documented git commit by the documented CI workflow, without trusting GTCX's account-level npm 2FA discipline.

## Alternatives Considered

| Option                                                              | Pros                                                              | Cons                                                                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Manual publish from developer laptop, account-wide token            | Simple                                                            | Account-wide token = catastrophic blast radius on compromise; developer machine in trust boundary |
| Manual publish from laptop, granular bypass-2FA token               | Manageable boundary                                               | Developer machine in trust boundary; no provenance                                                |
| CI-driven publish on git tag, granular bypass-2FA token             | Removes developer machine from trust boundary                     | Still no provenance; CI compromise possible                                                       |
| **CI-driven publish + SLSA provenance + granular bypass-2FA token** | External consumers verify independently; CI compromise detectable | Requires more upfront work; npm provenance has framework-specific requirements                    |

The decision: **adopt rules 1-3 immediately** (they apply to today's manual publish path); **add rule 4 before the next minor release** (when CI provenance plumbing has time to land properly).

## Consequences

**Positive:**

- Stolen credential blast radius is bounded — a granular `@gtcx/audit-signer`-scoped token cannot affect other npm scopes, even within `@gtcx`
- Clean-checkout rule prevents accidental publication of uncommitted code (a common foot-gun)
- Atomic version+tag+publish prevents npm/git divergence
- Future Sigstore provenance closes the supply-chain attack surface that even good 2FA discipline cannot

**Negative:**

- Publish is no longer a one-liner. Operators must follow the four rules; mis-following is detectable but tedious
- Granular tokens have a 90-day expiration; rotation discipline must be maintained
- Sigstore provenance requires CI changes; not free

**Neutral:**

- The first publish (`@gtcx/audit-signer@0.1.0` on 2026-05-22) preceded this ADR. It was done from a developer laptop with a granular bypass-2FA token, on a clean checkout, in a single atomic operation. The publish complies retroactively with rules 1-3; rule 4 (provenance) is the next-publish target.
- The granular token used for the first publish was rotated immediately after the publish per `docs/security/credential-rotation-log.md` (the original token was briefly exposed in a chat transcript before rotation).

## Implementation

Rules 1-3 are already in effect (verified by the 2026-05-22 publish process). Rule 4 lands as a separate PR adding:

- `.github/workflows/publish-audit-signer.yml` — tag-triggered publish workflow with OIDC-based npm auth (replacing the granular token approach with workload identity)
- `npm publish --provenance` in the workflow body
- Branch protection on `main` requiring all checks to pass

Target: before `@gtcx/audit-signer@0.2.0`.

## Threat coverage

| Threat (from `docs/security/threat-model-2026-05.md`) | Coverage under this ADR                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| T-4 (tamper with @gtcx/audit-signer on npm)           | Partial — rules 1-3 in place; rule 4 (provenance) is the full mitigation; tracked as SEC-OPEN-002 |
| E-3 (token-scope escalation)                          | N/A at npm layer; relevant to the gateway auth config secret                                      |

## References

- ADR-016 — Fail-Closed Audit Signing in Production (parallel security reasoning)
- `docs/security/threat-model-2026-05.md` — T-4 + SEC-OPEN-002
- `tools/audit-signer/package.json` — `prepublishOnly` script enforces the test gate
- `tools/audit-signer/CHANGELOG.md` — v0.1.0 publish record
- npm provenance docs: https://docs.npmjs.com/generating-provenance-statements
- SLSA framework: https://slsa.dev/
