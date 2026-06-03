## Credentials: system-of-record + ownership split (cross-repo)

**Canonical policy:** `gtcx-docs/docs/governance/protocols/19-agent-credential-access/protocol.md` (see “System-of-Record and Operational Ownership Split”).

- **System-of-record (SoR)**: `gtcx-agentic` Baseline vault (shared provider creds + audited access)
- **Runtime usage owner**: product repo (e.g. `gtcx-intelligence`) owns its runtime secrets
- **CI/automation owner**: `gtcx-infrastructure` owns org automation secrets/policy
- **Contracts only**: `gtcx-protocols` defines env var names, redaction rules, and artifact paths/globs

**Credentialed evidence packs:** run either via vault injection on a dev laptop or in infra-owned CI; write redacted JSON evidence only (no raw secrets).

## LLM routing + token usage (BaselineOS SoR)

| Concern                       | Owner          | Operator entry                                                |
| ----------------------------- | -------------- | ------------------------------------------------------------- |
| Route decisions + pricing     | `baseline-os`  | `baseline cost-route --prompt "..." --json`                   |
| Token usage aggregate         | `baseline-os`  | `baseline cost-stats --json`                                  |
| Agent vault (populate/verify) | `gtcx-agentic` | `pnpm agent:vault:verify`                                     |
| Staging vs production keys    | `gtcx-agentic` | `docs/operators/vault-environments.md`                        |
| Ecosystem coordination        | `baseline-os`  | `workstream/coordination/ECOSYSTEM-COST-ROUTER-2026-06-03.md` |

**Do not** use `baseline-os/infra/docker/.env.staging` for production vault work.
