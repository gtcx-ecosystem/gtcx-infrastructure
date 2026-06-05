#!/usr/bin/env bash
# =============================================================================
# Terraform Binary History Purge Script
# =============================================================================
# WARNING: This script rewrites Git history. It is DESTRUCTIVE and requires
# team coordination. Run only during a low-activity window (weekend).
#
# Prerequisites:
#   - git-filter-repo installed (pip install git-filter-repo)
#   - Repository admin access to disable branch protection for force-push
#   - Backup fork created
#
# Usage:
#   ./04-ship/03-platform/scripts/purge-terraform-history.sh
# =============================================================================

set -euo pipefail

REPO_URL="https://github.com/gtcx-ecosystem/gtcx-infrastructure.git"
BACKUP_DIR="/tmp/gtcx-infrastructure-backup-$(date +%s)"
PURGE_DIR="/tmp/gtcx-infrastructure-purge-$(date +%s)"

echo "=== GTCX Terraform History Purge ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# 1. Verify git-filter-repo is installed
if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "ERROR: git-filter-repo is required. Install with:"
  echo "  pip install git-filter-repo"
  echo "  # or"
  echo "  brew install git-filter-repo"
  exit 1
fi

# 2. Create backup
echo "Step 1: Creating backup fork at ${BACKUP_DIR}"
git clone --mirror "${REPO_URL}" "${BACKUP_DIR}"
echo "  Backup created: ${BACKUP_DIR}"

# 3. Fresh clone for purge
echo "Step 2: Fresh clone for purge"
git clone "${REPO_URL}" "${PURGE_DIR}"
cd "${PURGE_DIR}"

# 4. Run filter-repo
echo "Step 3: Running git-filter-repo"
git filter-repo \
  --path-glob '04-ship/terraform/**/*.tfstate*' \
  --path-glob '04-ship/terraform/**/.terraform/**' \
  --path-glob '04-ship/terraform/**/.terraform.lock.hcl' \
  --invert-paths \
  --force

# 5. Verify
echo "Step 4: Verifying purge"
REMAINING_TFSTATE=$(git log --all --full-history --name-only -- '**/*.tfstate*' 2>/dev/null | wc -l)
REMAINING_TERRAFORM=$(git log --all --full-history --name-only -- '**/.terraform/**' 2>/dev/null | wc -l)

if [ "$REMAINING_TFSTATE" -gt 0 ] || [ "$REMAINING_TERRAFORM" -gt 0 ]; then
  echo "ERROR: Terraform artifacts still found in history:"
  git log --all --full-history --name-only -- '**/*.tfstate*' 2>/dev/null || true
  git log --all --full-history --name-only -- '**/.terraform/**' 2>/dev/null || true
  exit 1
fi

echo "  Verified: no Terraform artifacts in history"

# 6. Show size reduction
echo "Step 5: Size comparison"
echo "  Original repo size:"
du -sh "${BACKUP_DIR}"
echo "  Purged repo size:"
du -sh "${PURGE_DIR}"

# 7. Force-push instructions
echo ""
echo "=== Purge Complete ==="
echo "To apply to origin, run:"
echo "  cd ${PURGE_DIR}"
echo "  git push origin --force --all"
echo "  git push origin --force --tags"
echo ""
echo "Then notify the team to re-clone."
echo "Backup: ${BACKUP_DIR}"
