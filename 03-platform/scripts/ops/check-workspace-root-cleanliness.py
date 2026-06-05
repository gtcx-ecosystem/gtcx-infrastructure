#!/usr/bin/env python3
"""Validate that the repo root matches 01-docs/operations/repo/root-allowlist.json.

Two modes:
  --strict           exit non-zero on any cleanliness issue (CI)
  --json-out PATH    write deterministic sidecar with axis counts (axes 3/6/7/8)
                     for downstream audit tooling to consume instead of re-deriving
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import subprocess
import sys

SEMVER_RE = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
ROOT = pathlib.Path(__file__).resolve().parents[3]
ALLOWLIST_PATH = ROOT / "01-docs/operations/repo/root-allowlist.json"
SCHEMA_PATH = ROOT / "01-docs/operations/repo/root-allowlist.schema.json"

# Deterministic axis configuration
BUILD_ARTIFACT_RE = re.compile(
    r"(^|/)(\.next|\.turbo|\.cache|dist|build|coverage|__pycache__|node_modules)(/|$)"
)
# Parent directories that hold SOURCE CODE about builds (not build outputs).
# A path like `03-platform/scripts/coverage/check.mjs` matches BUILD_ARTIFACT_RE because
# `coverage` is a segment, but it is the coverage CHECKER, not coverage output.
# Tightening for RH-P2-01: reject artifact matches whose immediate parent
# segment is one of these source-container directories.
ARTIFACT_FALSE_POSITIVE_PARENTS = ("scripts", "tools", "tests", "docs")
ARTIFACT_NAMES = ("coverage", "build", "dist", "out", "cache")
OS_JUNK_RE = re.compile(r"(^|/)(\.DS_Store|Thumbs\.db|desktop\.ini)$")
SIZE_OUTLIER_BYTES = 500_000  # 500 KB tracked file
# Directory-name prefixes the empty-dir walker always skips. Build-output dirs
# like Rust `target/` and Vite `.vite-temp/` are added at walk-time via
# git check-ignore — see compute_deterministic_axes (RH-P2-02).
WALKER_SKIP_PREFIXES = (
    ".git",
    "node_modules",
    ".turbo",
    ".venv",
    ".next",
    ".local",
    "target",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Check root cleanliness against 01-docs/operations/repo/root-allowlist.json. "
            "Optionally emit a deterministic JSON sidecar for repo-hygiene audits."
        )
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero when cleanliness issues are found.",
    )
    parser.add_argument(
        "--json-out",
        type=pathlib.Path,
        help="Write a sidecar with deterministic axis counts and the issue list.",
    )
    parser.add_argument(
        "--no-schema-check",
        action="store_true",
        help="Skip schema validation (use only when jsonschema is unavailable).",
    )
    return parser.parse_args(argv)


def load_allowlist() -> dict:
    if not ALLOWLIST_PATH.is_file():
        raise FileNotFoundError(f"Missing allowlist: {ALLOWLIST_PATH}")
    with ALLOWLIST_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def load_schema() -> dict | None:
    if not SCHEMA_PATH.is_file():
        return None
    with SCHEMA_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def validate_allowlist_shape(allowlist: dict) -> list[str]:
    """Lightweight structural validation that does not require jsonschema."""
    errors: list[str] = []
    required_top = ("version", "required_files", "allowed_files", "allowed_directories")
    for key in required_top:
        if key not in allowlist:
            errors.append(f"allowlist missing required key: `{key}`")

    version = allowlist.get("version")
    if isinstance(version, str) and not SEMVER_RE.match(version):
        errors.append(f"allowlist `version` must be semver, got `{version}`")

    schema_version = allowlist.get("schema_version")
    if schema_version is not None and (
        not isinstance(schema_version, str) or not SEMVER_RE.match(schema_version)
    ):
        errors.append(
            f"allowlist `schema_version` must be semver, got `{schema_version}`"
        )

    for key in ("required_files", "allowed_files", "allowed_directories"):
        value = allowlist.get(key)
        if value is not None and not isinstance(value, list):
            errors.append(f"allowlist `{key}` must be a list")

    human_owned = allowlist.get("human_owned_paths", {})
    if isinstance(human_owned, dict):
        for path_name, entry in human_owned.items():
            if not isinstance(entry, dict):
                errors.append(f"human_owned_paths.`{path_name}` must be an object")
                continue
            for required in ("owner", "agent_action", "ci_enforcement"):
                if required not in entry:
                    errors.append(
                        f"human_owned_paths.`{path_name}` missing `{required}`"
                    )
    return errors


def validate_against_schema(allowlist: dict, schema: dict) -> list[str]:
    """Validate with jsonschema if available; otherwise fall back to shape check."""
    try:
        import jsonschema  # type: ignore
    except ImportError:
        return validate_allowlist_shape(allowlist)

    validator = jsonschema.Draft202012Validator(schema)
    errors: list[str] = []
    for err in validator.iter_errors(allowlist):
        location = "/".join(str(p) for p in err.absolute_path) or "<root>"
        errors.append(f"{location}: {err.message}")
    return errors


def has_tracked_paths_under(name: str) -> bool:
    result = subprocess.run(
        ["git", "ls-files", name, f"{name}/"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    return bool(result.stdout.strip())


def is_gitignored_untracked(path: pathlib.Path) -> bool:
    """True when path exists only as a gitignored, non-tracked entry."""
    if has_tracked_paths_under(path.name):
        return False
    result = subprocess.run(
        ["git", "check-ignore", "-q", "--", path.name],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def should_skip(name: str, allowlist: dict) -> bool:
    if name in allowlist.get("ignored_exact", []):
        return True
    prefixes = allowlist.get("ignored_prefixes", [".", "node_modules"])
    return any(name.startswith(prefix) for prefix in prefixes)


def allowed_root_names(allowlist: dict) -> set[str]:
    names: set[str] = set()
    names.update(allowlist.get("required_files", []))
    names.update(allowlist.get("allowed_files", []))
    names.update(allowlist.get("allowed_directories", []))
    names.update(allowlist.get("allowed_dot_directories", []))
    names.update(allowlist.get("deprecated_files", {}).keys())
    return names


def find_issues(allowlist: dict, root: pathlib.Path | None = None) -> list[str]:
    issues: list[str] = []
    base = root or ROOT
    allowed = allowed_root_names(allowlist)
    forbidden = allowlist.get("forbidden_root_names", {})
    human_owned = set(allowlist.get("human_owned_paths", {}).keys())
    forbidden_prefixes = allowlist.get("forbidden_name_prefixes", [])
    deprecated = allowlist.get("deprecated_files", {})

    for entry in sorted(base.iterdir(), key=lambda path: path.name.lower()):
        name = entry.name
        if should_skip(name, allowlist):
            continue
        if base == ROOT and is_gitignored_untracked(entry):
            continue

        if name in human_owned:
            continue

        if name in forbidden:
            issues.append(f"Forbidden root entry `{name}` — {forbidden[name]}")
            continue

        if any(name.startswith(prefix) for prefix in forbidden_prefixes):
            issues.append(
                f"Loose artifact `{name}` at repo root; move to `.local/` (see repo-hygiene-protocol)."
            )
            continue

        if name in deprecated:
            issues.append(f"Deprecated root file `{name}` — {deprecated[name]}")
            continue

        if name not in allowed:
            hint = " See 01-docs/operations/repo/repo-hygiene-protocol.md for canonical homes."
            issues.append(
                f"Unexpected root entry `{name}` — not in root-allowlist.json.{hint}"
            )

    for required in allowlist.get("required_files", []):
        if not (base / required).is_file():
            issues.append(f"Required root file missing: `{required}`")

    return issues


def _is_build_artifact(path: str) -> bool:
    """Match BUILD_ARTIFACT_RE but reject source-tree false positives.

    RH-P2-01: 03-platform/scripts/coverage/check-summary.mjs is a coverage CHECKER, not
    coverage output. A path is a build artifact only when the artifact-named
    segment's immediate parent is not a source-container directory like
    `03-platform/scripts/`, `03-platform/tools/`, `tests/`, `01-docs/`.
    """
    if not BUILD_ARTIFACT_RE.search(path):
        return False
    parts = path.split("/")
    for idx, segment in enumerate(parts):
        if segment in ARTIFACT_NAMES:
            parent = parts[idx - 1] if idx > 0 else ""
            if parent in ARTIFACT_FALSE_POSITIVE_PARENTS:
                return False
            return True
        # Dot-prefixed artifact dirs (.next, .turbo, .cache, __pycache__,
        # node_modules) are always real outputs — no parent-based exception.
        if segment.startswith(".") or segment in ("__pycache__", "node_modules"):
            return True
    return True


def _gitignored_relpaths(paths: list[str]) -> set[str]:
    """Batch git check-ignore for the walker (RH-P2-02)."""
    if not paths:
        return set()
    result = subprocess.run(
        ["git", "check-ignore", "--stdin"],
        cwd=ROOT,
        input="\n".join(paths),
        capture_output=True,
        text=True,
        check=False,
    )
    return set(filter(None, result.stdout.splitlines()))


def compute_deterministic_axes() -> dict:
    """Axes 3/6/7/8 of the repo-hygiene scorecard, computed from git state."""
    tracked = subprocess.run(
        ["git", "ls-files"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    ).stdout.splitlines()

    build_artifacts = sorted({path for path in tracked if _is_build_artifact(path)})
    os_junk = sorted({path for path in tracked if OS_JUNK_RE.search(path)})

    size_outliers: list[dict] = []
    for path in tracked:
        full = ROOT / path
        try:
            size = full.stat().st_size
        except (FileNotFoundError, OSError):
            continue
        if size > SIZE_OUTLIER_BYTES:
            size_outliers.append({"path": path, "bytes": size})
    size_outliers.sort(key=lambda item: -item["bytes"])

    # First pass: collect candidate empty dirs. Skip always-ignored prefixes,
    # build-output dir names anywhere in the tree, and human-owned paths from
    # the live allowlist (so `_delete/` does not pollute the scorecard).
    human_owned: set[str] = set()
    try:
        allowlist = load_allowlist()
        human_owned = set(allowlist.get("human_owned_paths", {}).keys())
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    skip_top_segments = set(WALKER_SKIP_PREFIXES) | human_owned

    candidates: list[str] = []
    for current, dirs, files in os.walk(ROOT):
        rel = pathlib.Path(current).relative_to(ROOT).as_posix()
        if rel and rel.split("/")[0] in skip_top_segments:
            dirs[:] = []
            continue
        # Prune known build outputs anywhere in the tree (RH-P2-02).
        dirs[:] = [d for d in dirs if d not in WALKER_SKIP_PREFIXES]
        if rel and not dirs and not files:
            candidates.append(rel)

    # Second pass: filter via git check-ignore so anything matching .gitignore
    # is excluded, even if it slipped past the prefix skip.
    ignored = _gitignored_relpaths(candidates)
    empty_dirs = sorted(p for p in candidates if p not in ignored)

    return {
        "axis_3_build_artifacts": {
            "count": len(build_artifacts),
            "samples": build_artifacts[:20],
        },
        "axis_6_size_outliers": {
            "threshold_bytes": SIZE_OUTLIER_BYTES,
            "count": len(size_outliers),
            "samples": size_outliers[:20],
        },
        "axis_7_os_junk": {
            "count": len(os_junk),
            "samples": os_junk[:20],
        },
        "axis_8_empty_dirs": {
            "count": len(empty_dirs),
            "samples": empty_dirs[:20],
        },
    }


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    allowlist = load_allowlist()
    schema = None if args.no_schema_check else load_schema()
    schema_errors: list[str] = []
    if schema is not None:
        schema_errors = validate_against_schema(allowlist, schema)
    elif not args.no_schema_check:
        schema_errors = validate_allowlist_shape(allowlist)

    issues = find_issues(allowlist)

    print("# Workspace Root Cleanliness")
    print("")
    print("Policy: 01-docs/operations/repo/repo-hygiene-protocol.md")
    print(
        f"Allowlist: 01-docs/operations/repo/root-allowlist.json "
        f"(v{allowlist.get('version', '?')}, schema v{allowlist.get('schema_version', '?')})"
    )
    print("")

    exit_code = 0

    if schema_errors:
        print("Status: BLOCKED (allowlist invalid)")
        print("")
        print("Schema errors:")
        for err in schema_errors:
            print(f"- {err}")
        print("")
        exit_code = 1 if args.strict else 0

    if issues:
        print("Status: BLOCKED" if not schema_errors else "Additional issues:")
        print("")
        print("Issues:")
        for issue in issues:
            print(f"- {issue}")
        if args.strict:
            exit_code = 1
    elif not schema_errors:
        print("Status: PASS")
        print("")
        print("Repo root matches the canonical allowlist.")

    if args.json_out:
        sidecar = {
            "policy_source": "01-docs/operations/repo/repo-hygiene-protocol.md",
            "allowlist_path": str(ALLOWLIST_PATH.relative_to(ROOT)),
            "allowlist_version": allowlist.get("version"),
            "schema_version": allowlist.get("schema_version"),
            "schema_errors": schema_errors,
            "root_issues": issues,
            "deterministic_axes": compute_deterministic_axes(),
        }
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(sidecar, indent=2) + "\n", encoding="utf-8")
        print("")
        print(
            f"Sidecar: {args.json_out.relative_to(ROOT) if args.json_out.is_absolute() else args.json_out}"
        )

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
