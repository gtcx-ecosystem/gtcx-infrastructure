# Guide: Documentation Hygiene Runbook

How to run a documentation hygiene check across the repo.

## Checks

1. **Missing READMEs**
2. **Placeholder/TBD content**
3. **Broken internal links**
4. **Stale paths**

## Commands

### Quick Script

```bash
./scripts/doc-hygiene-check.sh
```

### Missing READMEs

```bash
find . -type d -not -path './.git*' -print0 | while IFS= read -r -d '' d; do
  if [ ! -f "$d/README.md" ] && [ ! -f "$d/readme.md" ]; then
    echo "$d"
  fi
done
```

### Placeholder/TBD

```bash
grep -rn 'TODO\|FIXME\|PLACEHOLDER\|TBD\|COMING SOON' . --include='*.md'
```

### Broken Internal Links

```bash
grep -rn '\[.*\](\./\|\.\./' . --include='*.md' | while read line; do
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

## Reporting

Log findings using the documentation hygiene template:

```
repo/3-agile/8-hygiene/templates/documentation-hygiene.md
```

For each issue found:

1. Record the file path, issue type, and severity
2. Assign an owner and due date
3. Track resolution in the nearest sprint or backlog

Severity guide:

- **P0** — Broken links or missing READMEs blocking navigation
- **P1** — Unfilled placeholders or stale paths in active docs
- **P2** — Inconsistent naming, orphan files, missing index entries
- **P3** — Style and formatting improvements

## Metadata

- **Owner**: Platform Operations
- **Effective Date**: 2026-03-01
- **Last Reviewed**: 2026-03-01
- **Next Review**: 2026-09-01
