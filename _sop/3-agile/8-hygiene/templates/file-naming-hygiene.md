# File Naming Hygiene

## Purpose

Consistent, predictable file naming across all [Organization Name] repositories. When every file follows the same naming conventions, developers can find files by intuition rather than searching, and tooling (linters, bundlers, scripts) works reliably across the ecosystem.

## Conventions

### Folders

- **Format**: lowercase, kebab-case
- **Examples**: `data-models/`, `go-to-market/`, `api-routes/`, `user-management/`
- **Never**: `DataModels/`, `Go To Market/`, `API_Routes/`

### Markdown Files

- **Format**: lowercase, kebab-case
- **Examples**: `sprint-review.md`, `tech-stack.md`, `onboarding-guide.md`
- **Never**: `Sprint Review.md`, `techStack.md`, `TECH_STACK.md`

### Source Code

Follow the language convention for the project:

| Language              | Convention              | Example                                  |
| --------------------- | ----------------------- | ---------------------------------------- |
| JavaScript/TypeScript | camelCase               | `userService.ts`, `authMiddleware.js`    |
| React Components      | PascalCase              | `UserCard.tsx`, `DashboardLayout.tsx`    |
| Python                | snake_case              | `user_service.py`, `data_pipeline.py`    |
| Rust                  | snake_case              | `token_parser.rs`, `migration_engine.rs` |
| CSS/SCSS              | kebab-case              | `button-styles.css`, `layout-grid.scss`  |
| CSS Modules           | camelCase or kebab-case | `buttonStyles.module.css`                |

### Config Files

- **Format**: lowercase, dot-prefix where standard
- **Examples**: `.gitignore`, `.prettierrc`, `.eslintrc.json`, `.editorconfig`, `tsconfig.json`
- **Never**: `GitIgnore`, `PRETTIERRC`, `Tsconfig.json`

### Special Files (UPPERCASE exceptions)

These files follow GitHub/community conventions and use UPPERCASE:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`

### General Rules

- **No spaces** — Never use spaces in filenames. Use hyphens or the appropriate casing convention.
- **No special characters** — Avoid `&`, `#`, `@`, `!`, `%`, `^`, `(`, `)`, and other special characters.
- **Numbered prefixes** — When ordering matters, use zero-padded `XX_` prefix (e.g., `01_setup/`, `02_configuration/`, `03_deployment/`). Follow {project_name} per-service conventions.
- **File extensions** — Always include the correct file extension. Never omit it. Never put extensions in folder names.

## Checklist

Perform a file naming hygiene review on `{repo_name}` ({date}):

- [ ] No uppercase `.md` files (except `README.md`, `LICENSE`, `CONTRIBUTING.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`)
- [ ] No spaces in any filename or folder name
- [ ] No special characters (`&`, `#`, `@`, `!`) in any filename
- [ ] All folders use kebab-case
- [ ] Config files follow [Organization Name] ecosystem standard
- [ ] Numbered folders use zero-padded `XX_` prefix
- [ ] No file extensions in folder names
- [ ] Source code files follow language-appropriate casing
- [ ] React component files use PascalCase
- [ ] Test files follow `{test_file_pattern}` convention

## Examples

| Bad                   | Good                                          | Rule                                    |
| --------------------- | --------------------------------------------- | --------------------------------------- |
| `My Document.md`      | `my-document.md`                              | No spaces, use kebab-case               |
| `UserCard.md`         | `user-card.md`                                | Markdown files use kebab-case           |
| `data & analytics/`   | `data-and-analytics/`                         | No special characters in folders        |
| `API_Routes/`         | `api-routes/`                                 | Folders use kebab-case, not UPPER_SNAKE |
| `usercard.tsx`        | `UserCard.tsx`                                | React components use PascalCase         |
| `1_setup/`            | `01_setup/`                                   | Zero-pad numbered prefixes              |
| `README.txt`          | `README.md`                                   | Use `.md` for documentation             |
| `src.old/`            | Remove or rename                              | No extensions in folder names           |
| `helpers.JS`          | `helpers.js`                                  | File extensions are lowercase           |
| `config/DB_CONFIG.ts` | `config/db-config.ts` or `config/dbConfig.ts` | Follow language convention              |
| `page (copy).md`      | `page-v2.md` or remove                        | No parentheses or "copy" suffixes       |
| `finalFINAL_v3.md`    | `sprint-review.md`                            | Use descriptive, stable names           |

## Automated Checks

Find files with spaces in their names:

```bash
find {repo_path} -name '* *' | grep -v node_modules | grep -v .git | grep -v .next
```

Find files with special characters:

```bash
find {repo_path} -name '*[&\#@!%^]*' | grep -v node_modules | grep -v .git
```

Find uppercase markdown files (excluding allowed exceptions):

```bash
find {repo_path} -name '*.md' | grep -v node_modules | grep -v .git | while read f; do
  base=$(basename "$f")
  if echo "$base" | grep -q '[A-Z]'; then
    case "$base" in
      README.md|LICENSE*|CONTRIBUTING.md|CHANGELOG.md|CODE_OF_CONDUCT.md|SECURITY.md|SUMMARY.md)
        ;;
      *)
        echo "Uppercase markdown: $f"
        ;;
    esac
  fi
done
```

Find uppercase folder names:

```bash
find {repo_path} -type d -name '*[A-Z]*' | grep -v node_modules | grep -v .git | grep -v .next
```

Find folders with file extensions in their names:

```bash
find {repo_path} -type d -name '*\.*' | grep -v node_modules | grep -v .git | grep -v .next | grep -v .github | grep -v .vscode
```

Find non-zero-padded numbered folders:

```bash
find {repo_path} -type d | grep -v node_modules | grep -v .git | while read dir; do
  base=$(basename "$dir")
  if echo "$base" | grep -qE '^[0-9]_'; then
    echo "Non-zero-padded: $dir"
  fi
done
```
