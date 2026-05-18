#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"

cd "$ROOT_DIR"

echo "== Missing READMEs =="
find . -type d -not -path './.git*' -print0 | while IFS= read -r -d '' d; do
  if [ ! -f "$d/README.md" ] && [ ! -f "$d/readme.md" ]; then
    echo "$d"
  fi
done

echo ""
echo "== Placeholder/TBD =="
rg -n "TODO|FIXME|PLACEHOLDER|TBD|COMING SOON" -g '*.md' || true

echo ""
echo "== Broken internal links =="
grep -rn '\[.*\](\./\|\.\./' . --include='*.md' | while read -r line; do
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

