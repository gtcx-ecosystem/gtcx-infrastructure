# Legacy repo id scan resolution — 2026-06-12

Follow-up to background fleet scan (~10,260 total lines including audit evidence).

## Operational gate

```bash
pnpm ecosystem:legacy-id:check   # bridge-os — all fleet repos in scope
```

**Status:** passing after gtcx-os + baseline-os registry pass.

## Per-repo counts (excl. `audit/evidence`, dated audit md)

| Repo           | Before | After | Action                                                       |
| -------------- | -----: | ----: | ------------------------------------------------------------ |
| gtcx-os        |   3718 | ~3717 | **Live `pm/` swept**; `archive/**` + `platform/**` protected |
| baseline-os    |    831 |  ~769 | workstream folders + `pm/spec` swept                         |
| fabric-os      |   1179 |  ~830 | coordination bodies + `pm/` swept                            |
| bridge-os      |    346 |  ~304 | `pm/` programs + sync templates swept                        |
| terminal-os    |    159 |  ~152 | W2 scripts → `fabric-os` paths                               |
| compliance-os  |    139 |  ~137 | chaos drill script                                           |
| exploration-os |    115 |  ~112 | verifier attach script                                       |
| markets-os     |     72 |   ~62 | `pm/` + ADR witness strings                                  |
| terra-os       |     43 |    43 | deferred                                                     |
| sensei-os      |     15 |    15 | deferred                                                     |

## Protected (do not delete or rewrite)

SoR: `bridge-os/pm/spec/legacy-repo-id-intentional-refs.v1.json`

- **`audit/**` entire trees** — old audit files are point-in-time witness; fixing legacy repo ids there is **not required\*\*
- Alias `legacyIds`, rename ADRs, cutover maps, P34 merge manifest
- `gtcx-os/archive/**`, `gtcx-os/platform/**` shadow domains
- `pm/ci/*-latest.*` witnesses
- `@gtx-markets/*` npm scope

## bridgeOS

No sibling-repo sweep required — refs only in `bridge-os` alias registry + rollout compatibility.
