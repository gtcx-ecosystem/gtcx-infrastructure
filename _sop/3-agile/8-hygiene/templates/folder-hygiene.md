# Folder Hygiene

## Purpose

Ensuring consistent, navigable folder structures across all [Organization Name] repositories. Clean folder structures reduce cognitive load, simplify onboarding, and prevent files from getting lost in deeply nested or poorly named directories.

## Standards

1. **All lowercase, kebab-case** — Folder names must use lowercase letters and hyphens only (e.g., `data-models/`, `go-to-market/`).
2. **No nested folders with same name as parent** — Avoid `reports/reports/` or `docs/docs/`. If a folder duplicates its parent name, flatten the structure.
3. **Every folder has a README.md** — Each directory must contain a `README.md` that explains its purpose and what belongs there.
4. **Empty folders tracked with .gitkeep** — If a folder must exist but has no content yet, add a `.gitkeep` file so Git tracks it.
5. **Max nesting depth: {max_depth} levels** — Folder structures should not exceed {max_depth} levels deep (recommended: 3-4). If you need more depth, reconsider the organization.
6. **No orphan folders** — A folder containing a single file should be evaluated. If the file can live at the parent level without ambiguity, move it up and remove the folder.

## Checklist

Perform a folder hygiene sweep on `{repo_name}` ({date}):

- [ ] No uppercase folder names
- [ ] No spaces or special characters in folder names
- [ ] No double-nested folders (parent/child with same name)
- [ ] Every directory has README.md or .gitkeep
- [ ] No empty folders without .gitkeep
- [ ] Folder depth does not exceed {max_depth} levels
- [ ] No orphan folders (single file inside)
- [ ] Folder names match {project_name} conventions

## Common Issues

| Issue                  | Example                                | Fix                                         |
| ---------------------- | -------------------------------------- | ------------------------------------------- |
| Uppercase folder name  | `Documents/`                           | Rename to `documents/`                      |
| Spaces in folder name  | `my folder/`                           | Rename to `my-folder/`                      |
| Parent-child same name | `reports/reports/`                     | Flatten to `reports/`                       |
| Empty folder untracked | `assets/` (empty)                      | Add `.gitkeep` or remove                    |
| Orphan folder          | `utils/helper.ts` (only file)          | Move `helper.ts` to parent, remove `utils/` |
| Excessive nesting      | `src/modules/core/lib/utils/helpers/`  | Flatten to `src/lib/helpers/` or similar    |
| Special characters     | `data & reports/`                      | Rename to `data-and-reports/`               |
| Inconsistent casing    | `DataModels/` mixed with `api-routes/` | Standardize to `data-models/`               |

## Automated Checks

Find uppercase folder names:

```bash
find {repo_path} -type d -name '*[A-Z]*' | grep -v node_modules | grep -v .git | grep -v .next
```

Find folders with spaces:

```bash
find {repo_path} -type d -name '* *' | grep -v node_modules | grep -v .git
```

Find empty directories (no .gitkeep):

```bash
find {repo_path} -type d -empty | grep -v node_modules | grep -v .git | grep -v .next
```

Find folders deeper than {max_depth} levels:

```bash
find {repo_path} -mindepth {max_depth} -type d | grep -v node_modules | grep -v .git | grep -v .next
```

Find orphan folders (directories with exactly one file):

```bash
for dir in $(find {repo_path} -type d | grep -v node_modules | grep -v .git); do
  count=$(find "$dir" -maxdepth 1 -type f | wc -l)
  subdirs=$(find "$dir" -maxdepth 1 -type d | wc -l)
  if [ "$count" -eq 1 ] && [ "$subdirs" -eq 1 ]; then
    echo "Orphan folder: $dir"
  fi
done
```

Find duplicate parent-child folder names:

```bash
find {repo_path} -type d | while read dir; do
  parent=$(basename "$(dirname "$dir")")
  child=$(basename "$dir")
  if [ "$parent" = "$child" ]; then
    echo "Duplicate nesting: $dir"
  fi
done
```
