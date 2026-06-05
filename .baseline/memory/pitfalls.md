# Known Pitfalls

## Active TODOs / FIXMEs in Code
**Discovered:** 2026-05-27
| File | Line | Issue |
|------|------|-------|
| 01-docs/README.md | 169 | Bounty Policy](security/bug-bounty-policy.md) — Vulnerability disclosure program |
| 01-docs/01-agents/onboarding/contributor-guide.md | 31 | fixes or misconfiguration      | `fix/terraform-state-lock-timeout`     | |
| 01-docs/01-agents/onboarding/contributor-guide.md | 54 | fix or misconfiguration correction     | |
| 01-docs/01-agents/onboarding/contributor-guide.md | 176 | reports, feature requests, questions   | |
| 01-docs/01-agents/workflows/agent-checklist.md | 138 | Fix |
| 01-docs/01-agents/workflows/agent-checklist.md | 142 | reproduced locally? |
| 01-docs/01-agents/workflows/agent-checklist.md | 158 | resolved? |
| 01-docs/01-agents/workflows/agent-safety-rules.md | 368 | endpoints |
| 01-docs/01-agents/workflows/agent-safety-rules.md | 386 | comments without ticket numbers |
| 01-docs/01-agents/workflows/cut-release.md | 143 | plan.tfplan |

> Review and resolve these before they become blockers.

## Agent false blocks (normative 2026-06-05)

**SoR:** [ecosystem-unblock-playbook-2026-06.md](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/ecosystem-unblock-playbook-2026-06.md)

- **Do not** treat `EXT-INF-*` as reason to stop IR-2.x / validate-all merges — XC track is separate (infra auto-dev-state § EXT-INF blocked).
- **Do not** re-work INT-S9-01 WAF/routing — **done**; ping **gtcx-intelligence** for credentialed acceptance.
- **Do not** mark INT-S9-01 done on anon 401 probe alone.

## Code Quality
**Discovered:** 2026-05-27
- Add pitfalls here as they are discovered

