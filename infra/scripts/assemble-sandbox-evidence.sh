#!/usr/bin/env bash
# =============================================================================
# assemble-sandbox-evidence.sh
# =============================================================================
# Collects all security scan artifacts from CI and assembles a single evidence
# package for sandbox licensing applications.
#
# Usage:
#   bash assemble-sandbox-evidence.sh \
#     --input-dir=evidence-raw \
#     --output-dir=evidence-package \
#     --environment=staging \
#     --run-id=12345 \
#     --commit=abc123
# =============================================================================

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
INPUT_DIR=""
OUTPUT_DIR=""
ENVIRONMENT="staging"
RUN_ID="unknown"
COMMIT="unknown"

# ── Parse arguments ───────────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --input-dir=*)  INPUT_DIR="${arg#*=}" ;;
    --output-dir=*) OUTPUT_DIR="${arg#*=}" ;;
    --environment=*) ENVIRONMENT="${arg#*=}" ;;
    --run-id=*)     RUN_ID="${arg#*=}" ;;
    --commit=*)     COMMIT="${arg#*=}" ;;
    --help)
      echo "Usage: assemble-sandbox-evidence.sh --input-dir=DIR --output-dir=DIR [--environment=ENV] [--run-id=ID] [--commit=SHA]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

if [ -z "$INPUT_DIR" ] || [ -z "$OUTPUT_DIR" ]; then
  echo "Error: --input-dir and --output-dir are required" >&2
  exit 1
fi

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)

# ── Setup output ──────────────────────────────────────────────────────────────
mkdir -p "${OUTPUT_DIR}/dast"
mkdir -p "${OUTPUT_DIR}/container"
mkdir -p "${OUTPUT_DIR}/sast"
mkdir -p "${OUTPUT_DIR}/dependency"
mkdir -p "${OUTPUT_DIR}/sbom"

# ── Collect DAST artifacts ────────────────────────────────────────────────────
DAST_COUNT=0
if [ -d "${INPUT_DIR}/evidence-dast" ]; then
  cp -r "${INPUT_DIR}/evidence-dast/"* "${OUTPUT_DIR}/dast/" 2>/dev/null || true
  DAST_COUNT=$(find "${OUTPUT_DIR}/dast" -name '*.json' -o -name '*.html' | wc -l | tr -d ' ')
fi
echo "DAST: ${DAST_COUNT} report(s) collected"

# ── Collect container scan artifacts ──────────────────────────────────────────
TRIVY_COUNT=0
SBOM_COUNT=0
for dir in "${INPUT_DIR}"/evidence-container-*; do
  [ -d "$dir" ] || continue
  # Trivy reports
  for f in "$dir"/trivy-*.sarif "$dir"/trivy-*.json; do
    [ -f "$f" ] || continue
    cp "$f" "${OUTPUT_DIR}/container/"
    TRIVY_COUNT=$((TRIVY_COUNT + 1))
  done
  # SBOMs
  for f in "$dir"/sbom-*.cdx.json; do
    [ -f "$f" ] || continue
    cp "$f" "${OUTPUT_DIR}/sbom/"
    SBOM_COUNT=$((SBOM_COUNT + 1))
  done
done
echo "Container: ${TRIVY_COUNT} scan report(s), ${SBOM_COUNT} SBOM(s) collected"

# ── Collect SAST artifacts ────────────────────────────────────────────────────
SAST_COUNT=0
if [ -d "${INPUT_DIR}/evidence-sast" ]; then
  cp -r "${INPUT_DIR}/evidence-sast/"* "${OUTPUT_DIR}/sast/" 2>/dev/null || true
  SAST_COUNT=$(find "${OUTPUT_DIR}/sast" -type f | wc -l | tr -d ' ')
fi
echo "SAST: ${SAST_COUNT} file(s) collected"

# ── Collect dependency audit ──────────────────────────────────────────────────
DEP_FINDINGS=0
if [ -d "${INPUT_DIR}/evidence-dependency-audit" ]; then
  cp -r "${INPUT_DIR}/evidence-dependency-audit/"* "${OUTPUT_DIR}/dependency/" 2>/dev/null || true
  if [ -f "${OUTPUT_DIR}/dependency/npm-audit.json" ]; then
    DEP_FINDINGS=$(wc -l < "${OUTPUT_DIR}/dependency/npm-audit.json" | tr -d ' ')
  fi
fi
echo "Dependency: audit report collected (${DEP_FINDINGS} lines)"

# ── Count findings from Trivy JSON reports ────────────────────────────────────
TRIVY_CRITICAL=0
TRIVY_HIGH=0
TRIVY_MEDIUM=0
for f in "${OUTPUT_DIR}"/container/trivy-*.json; do
  [ -f "$f" ] || continue
  C=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "$f" 2>/dev/null || echo 0)
  H=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH")] | length' "$f" 2>/dev/null || echo 0)
  M=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "MEDIUM")] | length' "$f" 2>/dev/null || echo 0)
  TRIVY_CRITICAL=$((TRIVY_CRITICAL + C))
  TRIVY_HIGH=$((TRIVY_HIGH + H))
  TRIVY_MEDIUM=$((TRIVY_MEDIUM + M))
done

# ── Count findings from ZAP JSON report ───────────────────────────────────────
ZAP_CRITICAL=0
ZAP_HIGH=0
ZAP_MEDIUM=0
for f in "${OUTPUT_DIR}"/dast/zap-report-*.json; do
  [ -f "$f" ] || continue
  ZAP_CRITICAL=$(jq '[.site[].alerts[] | select(.riskcode == "4")] | length' "$f" 2>/dev/null || echo 0)
  ZAP_HIGH=$(jq '[.site[].alerts[] | select(.riskcode == "3")] | length' "$f" 2>/dev/null || echo 0)
  ZAP_MEDIUM=$(jq '[.site[].alerts[] | select(.riskcode == "2")] | length' "$f" 2>/dev/null || echo 0)
done

# ── Count dependency audit findings ───────────────────────────────────────────
DEP_CRITICAL=0
DEP_HIGH=0
DEP_MODERATE=0
if [ -f "${OUTPUT_DIR}/dependency/npm-audit.json" ]; then
  DEP_CRITICAL=$(grep -c '"critical"' "${OUTPUT_DIR}/dependency/npm-audit.json" 2>/dev/null || echo 0)
  DEP_HIGH=$(grep -c '"high"' "${OUTPUT_DIR}/dependency/npm-audit.json" 2>/dev/null || echo 0)
  DEP_MODERATE=$(grep -c '"moderate"' "${OUTPUT_DIR}/dependency/npm-audit.json" 2>/dev/null || echo 0)
fi

# ── Generate manifest ─────────────────────────────────────────────────────────
cat > "${OUTPUT_DIR}/manifest.json" <<MANIFEST
{
  "version": "1.0.0",
  "generated_at": "${TIMESTAMP}",
  "environment": "${ENVIRONMENT}",
  "run_id": "${RUN_ID}",
  "commit": "${COMMIT}",
  "scans": {
    "dast": { "tool": "OWASP ZAP", "reports": ${DAST_COUNT} },
    "container": { "tool": "Trivy", "reports": ${TRIVY_COUNT}, "sboms": ${SBOM_COUNT} },
    "sast": { "tool": "CodeQL", "files": ${SAST_COUNT} },
    "dependency": { "tool": "pnpm audit", "collected": true }
  }
}
MANIFEST

# ── Generate summary markdown ─────────────────────────────────────────────────
TOTAL_CRITICAL=$((ZAP_CRITICAL + TRIVY_CRITICAL + DEP_CRITICAL))
TOTAL_HIGH=$((ZAP_HIGH + TRIVY_HIGH + DEP_HIGH))
TOTAL_MEDIUM=$((ZAP_MEDIUM + TRIVY_MEDIUM + DEP_MODERATE))

cat > "${OUTPUT_DIR}/summary.md" <<SUMMARY
## Security Evidence Package — Sandbox Application

**Environment:** ${ENVIRONMENT}
**Generated:** ${TIMESTAMP}
**Commit:** \`${COMMIT}\`
**Run:** ${RUN_ID}

### Scan Coverage

| Scan | Tool | Artifacts |
|------|------|-----------|
| DAST | OWASP ZAP | ${DAST_COUNT} report(s) |
| Container | Trivy | ${TRIVY_COUNT} scan(s), ${SBOM_COUNT} SBOM(s) |
| SAST | CodeQL | ${SAST_COUNT} file(s) |
| Dependency | pnpm audit | 1 report |

### Findings Summary

| Source | Critical | High | Medium |
|--------|----------|------|--------|
| DAST (ZAP) | ${ZAP_CRITICAL} | ${ZAP_HIGH} | ${ZAP_MEDIUM} |
| Container (Trivy) | ${TRIVY_CRITICAL} | ${TRIVY_HIGH} | ${TRIVY_MEDIUM} |
| Dependency audit | ${DEP_CRITICAL} | ${DEP_HIGH} | ${DEP_MODERATE} |
| **Total** | **${TOTAL_CRITICAL}** | **${TOTAL_HIGH}** | **${TOTAL_MEDIUM}** |

### Package Contents

\`\`\`
evidence-package/
  manifest.json
  summary.md
  dast/          — ZAP HTML + JSON reports
  container/     — Trivy SARIF + JSON per image
  sast/          — CodeQL SARIF results
  dependency/    — npm-audit.json
  sbom/          — CycloneDX SBOMs per container
\`\`\`
SUMMARY

echo ""
echo "Evidence package assembled: ${OUTPUT_DIR}/"
echo "  Total critical: ${TOTAL_CRITICAL}"
echo "  Total high:     ${TOTAL_HIGH}"
echo "  Total medium:   ${TOTAL_MEDIUM}"
echo ""
echo "Package manifest: ${OUTPUT_DIR}/manifest.json"
echo "Summary:          ${OUTPUT_DIR}/summary.md"
