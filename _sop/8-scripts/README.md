# Scripts — gtcx-protocols

Developer utility scripts for the `gtcx-protocols` monorepo.

## Available Scripts

| Script                                      | Command                   | Purpose                                         |
| ------------------------------------------- | ------------------------- | ----------------------------------------------- |
| `scripts/check-performance-baseline.mjs`    | `pnpm perf:check`         | Verify performance benchmarks are within budget |
| `scripts/refresh-performance-baseline.mjs`  | `pnpm perf:refresh`       | Update stored performance baseline              |
| `scripts/perf-scenarios.mjs`                | (internal)                | Performance scenario definitions                |
| `scripts/check-architecture-boundaries.mjs` | `pnpm architecture:check` | Enforce package dependency boundaries           |

## What Belongs Here

- CI-runnable `.mjs` scripts that enforce quality gates
- Developer utility scripts that don't belong in `package.json` scripts

## What Does NOT Belong Here

- GitHub Actions workflow files → `.github/workflows/`
- Build configuration → `turbo.json`, `tsconfig.json`, individual `package.json`
- Release scripts → `_sop/5-release/`

## References

- `_sop/6-metrics/README.md` — the targets these scripts enforce
- `_sop/2-docs/3-engineering/git-workflow.md` — release gate sequence
