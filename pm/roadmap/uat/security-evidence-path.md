---
jtbdId: JTBD-security-evidence-path
flowId: flow-secas-pentest-evidence
generator: uatFromJtbd
status: draft
---

# UAT — Security evidence path

| #   | Scenario                              | Expected                                                  |
| --- | ------------------------------------- | --------------------------------------------------------- |
| 1   | Run `pnpm secas:approval:check:write` | Approval-needed count matches register                    |
| 2   | Run `pnpm secas:friction:check:write` | Open P0 documented with owner                             |
| 3   | Verify EXT-INF-002 evidence JSON      | `audit/evidence/ext-inf-002-sow-approval-2026-06-10.json` |
| 4   | Verify kickoff prep doc               | Links fleet health prerequisite                           |
