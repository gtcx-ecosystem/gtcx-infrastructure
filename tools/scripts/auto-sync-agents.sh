#!/usr/bin/env bash
# =============================================================================
# Auto-Sync Agent Output Across GTCX Ecosystem
# =============================================================================
# Runs every 60 seconds, commits uncommitted work in all repos,
# and pushes to origin where remotes exist.
#
# Usage:
#   ./auto-sync-agents.sh          # foreground (Ctrl-C to stop)
#   ./auto-sync-agents.sh &        # background
#   nohup ./auto-sync-agents.sh &  # survive logout
#
# Principles: RESILIENT (P12), AUDITABLE (P3)
# =============================================================================

set -euo pipefail

ECOSYSTEM_ROOT="${ECOSYSTEM_ROOT:-/Users/amanianai/Sites/gtcx-ecosystem}"
INTERVAL_SEC="${INTERVAL_SEC:-60}"

cd "$ECOSYSTEM_ROOT"

log_info() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
log_warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >&2; }

sync_repo() {
  local repo="$1"
  cd "$repo" || return

  if [[ ! -d .git ]]; then
    return
  fi

  local uncommitted
  uncommitted=$(git status --short 2>/dev/null | wc -l | tr -d ' ')

  if [[ "$uncommitted" -eq 0 ]]; then
    return
  fi

  git add --all
  if git commit --no-verify -m "chore($(basename "$repo")): auto-sync agent output" >/dev/null 2>&1; then
    if git push origin main >/dev/null 2>&1; then
      log_info "$(basename "$repo"): synced + pushed ($uncommitted files)"
    else
      log_warn "$(basename "$repo"): synced locally, push failed"
    fi
  fi

  cd "$ECOSYSTEM_ROOT" || exit
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

log_info "Starting ecosystem auto-sync (interval: ${INTERVAL_SEC}s)"

while true; do
  for dir in */; do
    repo="${dir%/}"
    sync_repo "$repo" || true
  done
  sleep "$INTERVAL_SEC"
done
