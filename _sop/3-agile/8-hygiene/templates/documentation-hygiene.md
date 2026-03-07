# Documentation Hygiene

## Purpose

Ensuring documentation across [Organization Name] projects is accurate, current, and navigable. Stale, broken, or orphaned docs erode trust and waste time. This checklist provides a systematic approach to maintaining documentation quality.

## Standards

1. **Every folder has a README** — Each directory must contain a `README.md` that explains what belongs there and links to its contents.
2. **No broken internal links** — All relative links between docs must resolve to existing files. Dead links must be fixed or removed.
3. **No stale path references** — File paths mentioned in docs must match the actual filesystem. After renaming or moving files, update all references.
4. **Consistent branding** — Use current product names and company names ({organization}, {product_name}). Remove references to old names or deprecated terms.
5. **No orphan docs** — Every document must be reachable from at least one README or navigation file. Files not linked from anywhere are effectively invisible.
6. **No duplicate content** — The same information should not be maintained in multiple places. Use links to a single source of truth.
7. **Dates and versions updated** — When content changes, update any associated dates, version numbers, or "last updated" fields.

## Checklist

Perform a documentation hygiene review on `{repo_name}` ({date}):

### Structure

- [ ] Documentation follows {folder_standard} folder standard
- [ ] All subfolders are pre-created per the standard
- [ ] Every folder contains a `README.md`
- [ ] Folder structure matches the documented architecture
- [ ] No unexpected or undocumented folders

### Links

- [ ] No broken internal links (relative paths resolve to existing files)
- [ ] No stale path references in code examples or instructions
- [ ] External links validated (no 404s)
- [ ] Anchor links within documents resolve correctly
- [ ] Cross-repo links use correct URLs

### Content

- [ ] No outdated branding (old product names, old company names)
- [ ] No stale dates or version numbers
- [ ] No `TODO`, `FIXME`, or `PLACEHOLDER` left in published docs
- [ ] No placeholder text remaining (e.g., "Lorem ipsum", "{fill_this_in}")
- [ ] Code examples are tested and working
- [ ] Screenshots and diagrams reflect current UI/architecture

### Consistency

- [ ] Consistent heading hierarchy (H1 for title, H2 for sections, H3 for subsections)
- [ ] Consistent table formatting across all docs
- [ ] Consistent naming conventions (same term for same concept throughout)
- [ ] Consistent date format ({date_format})
- [ ] Consistent code block language tags (`typescript not `ts, etc.)

### Navigation

- [ ] Every document is reachable from a README or navigation file
- [ ] No orphan files (docs not linked from anywhere)
- [ ] GitBook `SUMMARY.md` matches actual file structure (if applicable)
- [ ] Table of contents in long documents is accurate
- [ ] Breadcrumb paths are correct (if applicable)

## Common Issues

| Issue                | How to Find                                                        | Fix                                                                      |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Broken internal link | `grep -rn '\[.*\](\..*\.md)' docs/` and verify each path           | Update the link to the correct path or remove if target no longer exists |
| Stale path reference | `grep -rn 'src/' docs/` and cross-reference with actual filesystem | Update paths to match current file locations                             |
| Orphan document      | Compare file list against all README links                         | Add a link from the appropriate README or remove the file                |
| Outdated branding    | `grep -rni '{old_brand_name}' docs/`                               | Replace with `{product_name}`                                            |
| Placeholder text     | `grep -rn 'TODO\|FIXME\|PLACEHOLDER\|Lorem ipsum' docs/`           | Fill in actual content or remove the section                             |
| Duplicate content    | Manual review of similar-sounding doc titles                       | Consolidate into a single source and link from other locations           |
| Missing README       | `find docs/ -type d ! -exec test -e '{}/README.md' \; -print`      | Create a README.md for each folder found                                 |
| Stale dates          | `grep -rn '202[0-4]' docs/` (adjust year range)                    | Update to current dates                                                  |

## Verification Commands

Find broken internal markdown links:

```bash
grep -rn '\[.*\](\./\|\.\./' {docs_path} | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  link=$(echo "$line" | grep -o '(\.[^)]*\.md)' | tr -d '()')
  if [ -n "$link" ]; then
    dir=$(dirname "$file")
    target="$dir/$link"
    if [ ! -f "$target" ]; then
      echo "BROKEN: $file -> $link"
    fi
  fi
done
```

Find folders without README.md:

```bash
find {docs_path} -type d | while read dir; do
  if [ ! -f "$dir/README.md" ]; then
    echo "Missing README: $dir"
  fi
done
```

Find orphan files (not referenced by any README):

```bash
for file in $(find {docs_path} -name '*.md' ! -name 'README.md'); do
  basename=$(basename "$file")
  refs=$(grep -rl "$basename" {docs_path} --include='README.md' | wc -l)
  if [ "$refs" -eq 0 ]; then
    echo "Orphan: $file"
  fi
done
```

Find TODO/FIXME/PLACEHOLDER markers:

```bash
grep -rn 'TODO\|FIXME\|PLACEHOLDER\|TBD\|COMING SOON' {docs_path} --include='*.md'
```

Find stale date references:

```bash
grep -rn '20[0-9][0-9]' {docs_path} --include='*.md' | grep -v '{current_year}'
```
