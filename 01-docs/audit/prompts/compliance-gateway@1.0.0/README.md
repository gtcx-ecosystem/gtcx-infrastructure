# compliance-gateway prompts @1.0.0

Semver-tagged system prompt (SIGNAL INF-014).

| File            | Role                                                |
| --------------- | --------------------------------------------------- |
| `manifest.json` | Version + audit field metadata                      |
| `system.md`     | Static template (jurisdictions injected at runtime) |
| `CHANGELOG.md`  | Version history                                     |

Runtime: `03-platform/tools/compliance-gateway/src/system-prompt.mjs` · Audit field: `promptVersion` on `query:success`.
