---
jtbdId: JTBD-fleet-health-witness
flowId: flow-fleet-health-witness
generator: uatFromJtbd
status: draft
---

# UAT — Fleet health witness

| #   | Scenario                                                                       | Expected                      |
| --- | ------------------------------------------------------------------------------ | ----------------------------- |
| 1   | Run `pnpm daas:fleet:health`                                                   | Exit code 0                   |
| 2   | Inspect `audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json` | Fresh timestamp, PASS entries |
| 3   | Run `pnpm daas:friction:check:write`                                           | Open P0 = 0                   |
| 4   | Run `node platform/tools/scripts/validate-all.mjs`                             | All gates pass                |
