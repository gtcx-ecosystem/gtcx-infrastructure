# `.husky/` — Git hooks

Pre-commit hooks for `fabric-os`. Configured via root `package.json` `"prepare": "husky"`.

**Active hook:** `pre-commit` runs `lint-staged` (Prettier on staged `*.{json,md,yml,yaml}` and related paths).

**Owner:** Platform engineering. Do not bypass hooks with `--no-verify` unless explicitly authorized.
