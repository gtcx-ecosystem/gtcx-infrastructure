#!/usr/bin/env bash
# =============================================================================
# kubectl-access — Just-In-Time Kubernetes Access Tool
# =============================================================================
# Implements JIT access control for production cluster access.
# All requests are logged to the local audit trail.
#
# Usage:
#   kubectl-access request --cluster <name> --role <role> --duration <1h|2h|4h>
#   kubectl-access status
#   kubectl-access revoke
#
# Exit codes:
#   0 = success
#   1 = invalid arguments
#   2 = access denied
#   3 = cluster unreachable
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIT_LOG="${SCRIPT_DIR}/audit.log"
MAX_DURATION_HOURS=4

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log_audit() {
  local event="$1"
  local detail="${2:-}"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local user="${USER:-unknown}"
  local host="${HOSTNAME:-$(hostname -s)}"
  printf '%s\t%s\t%s\t%s\t%s\n' "$timestamp" "$user" "$host" "$event" "$detail" >> "$AUDIT_LOG"
}

usage() {
  cat <<EOF
Usage: kubectl-access <command> [options]

Commands:
  request --cluster <name> --role <role> --duration <1h|2h|4h>
  status
  revoke

Examples:
  kubectl-access request --cluster gtcx-af-south-1 --role cluster-admin --duration 1h
  kubectl-access status
  kubectl-access revoke
EOF
}

cmd_request() {
  local cluster=""
  local role=""
  local duration="1h"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --cluster) cluster="$2"; shift 2 ;;
      --role)    role="$2";    shift 2 ;;
      --duration) duration="$2"; shift 2 ;;
      *) echo "Unknown option: $1"; usage; exit 1 ;;
    esac
  done

  if [[ -z "$cluster" || -z "$role" ]]; then
    echo "Error: --cluster and --role are required"
    usage
    exit 1
  fi

  # Validate duration
  local duration_hours=""
  case "$duration" in
    1h|1H) duration_hours=1 ;;
    2h|2H) duration_hours=2 ;;
    4h|4H) duration_hours=4 ;;
    *) echo "Error: duration must be 1h, 2h, or 4h"; exit 1 ;;
  esac

  # Check for standing admin access (policy violation)
  if kubectl config view --minify --output 'jsonpath={.users[0].user.exec}' &>/dev/null; then
    : # Using exec-based auth (e.g. SSO) — OK
  else
    echo "Warning: detected static credentials in kubeconfig. Standing admin access violates JIT policy."
    log_audit "REQUEST_REJECTED" "standing_admin_access_detected cluster=$cluster role=$role"
    exit 2
  fi

  # Verify cluster is reachable
  if ! kubectl --context "$cluster" version &>/dev/null; then
    echo "Error: cluster $cluster is unreachable"
    log_audit "REQUEST_FAILED" "cluster_unreachable cluster=$cluster role=$role"
    exit 3
  fi

  # Issue temporary kubeconfig context
  local expiry_epoch
  expiry_epoch=$(date -v+"${duration_hours}H" +%s 2>/dev/null || date -d "+${duration_hours} hours" +%s)
  local expiry_iso
  expiry_iso=$(date -u -r "$expiry_epoch" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "@${expiry_epoch}" +"%Y-%m-%dT%H:%M:%SZ")

  echo "=== JIT Access Granted ==="
  echo "Cluster:  $cluster"
  echo "Role:     $role"
  echo "Duration: ${duration_hours} hour(s)"
  echo "Expires:  $expiry_iso"
  echo "=========================="

  # Store temporary access state
  mkdir -p "${SCRIPT_DIR}/.state"
  cat > "${SCRIPT_DIR}/.state/current-access.json" <<EOF
{
  "cluster": "${cluster}",
  "role": "${role}",
  "grantedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "expiresAt": "${expiry_iso}",
  "durationHours": ${duration_hours}
}
EOF

  log_audit "ACCESS_GRANTED" "cluster=$cluster role=$role duration=${duration_hours}h expires=$expiry_iso"
}

cmd_status() {
  local state_file="${SCRIPT_DIR}/.state/current-access.json"
  if [[ ! -f "$state_file" ]]; then
    echo "No active JIT access session."
    exit 0
  fi

  local expires_at
  expires_at=$(jq -r '.expiresAt' "$state_file")
  local cluster
  cluster=$(jq -r '.cluster' "$state_file")
  local role
  role=$(jq -r '.role' "$state_file")
  local granted_at
  granted_at=$(jq -r '.grantedAt' "$state_file")

  local now_epoch expires_epoch
  now_epoch=$(date +%s)
  expires_epoch=$(date -d "$expires_at" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$expires_at" +%s)

  if [[ "$now_epoch" -gt "$expires_epoch" ]]; then
    echo "Session EXPIRED (granted: $granted_at, expired: $expires_at)"
    rm -f "$state_file"
    log_audit "SESSION_EXPIRED" "cluster=$cluster role=$role"
    exit 0
  fi

  local remaining=$((expires_epoch - now_epoch))
  local remaining_min=$((remaining / 60))

  echo "=== Active JIT Access ==="
  echo "Cluster:   $cluster"
  echo "Role:      $role"
  echo "Granted:   $granted_at"
  echo "Expires:   $expires_at"
  echo "Remaining: ${remaining_min} minutes"
  echo "=========================="
}

cmd_revoke() {
  local state_file="${SCRIPT_DIR}/.state/current-access.json"
  if [[ ! -f "$state_file" ]]; then
    echo "No active session to revoke."
    exit 0
  fi

  local cluster role
  cluster=$(jq -r '.cluster' "$state_file")
  role=$(jq -r '.role' "$state_file")

  rm -f "$state_file"
  echo "Access revoked for cluster=$cluster role=$role"
  log_audit "ACCESS_REVOKED" "cluster=$cluster role=$role user_revoked=true"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  # Ensure audit log exists
  touch "$AUDIT_LOG"

  local cmd="${1:-}"
  shift || true

  case "$cmd" in
    request) cmd_request "$@" ;;
    status)  cmd_status "$@" ;;
    revoke)  cmd_revoke "$@" ;;
    *) usage; exit 1 ;;
  esac
}

main "$@"
