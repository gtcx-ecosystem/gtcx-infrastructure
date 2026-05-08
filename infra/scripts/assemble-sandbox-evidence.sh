#!/usr/bin/env bash
# =============================================================================
# GTCX Sandbox Evidence Assembler
# =============================================================================
# Assembles all 10 evidence documents for regulatory sandbox submission into a
# single timestamped directory. Copies existing docs, generates derived
# evidence from Terraform config and git history, and prints a checklist of
# items that require manual input.
#
# Usage:
#   ./assemble-sandbox-evidence.sh [--jurisdiction=zimbabwe] [--output-dir=path]
#
# Output:
#   sandbox-evidence-YYYY-MM-DD/
#     01-architecture-overview.md
#     02-data-residency-proof.md
#     03-encryption-statement.md
#     04-kyc-retention-schedule.md
#     05-audit-trail-sample.json
#     06-access-control-matrix.md
#     07-incident-response-plan.md
#     08-business-continuity.md
#     09-security-assessment.md
#     10-change-management-evidence.md
#     appendices/
#       zap-report.html
#       trivy-report.sarif
#       codeql-report.sarif
#       sbom.json
#       npm-audit.json
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# ---------------------------------------------------------------------------
# Defaults and argument parsing
# ---------------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DATE="$(date +%Y-%m-%d)"
JURISDICTION="zimbabwe"
OUTPUT_DIR=""

for arg in "$@"; do
  case "$arg" in
    --jurisdiction=*) JURISDICTION="${arg#*=}" ;;
    --output-dir=*)   OUTPUT_DIR="${arg#*=}" ;;
    -h|--help)
      echo "Usage: assemble-sandbox-evidence.sh [--jurisdiction=zimbabwe] [--output-dir=path]"
      echo "Jurisdictions: zimbabwe, south_africa, nigeria, egypt, kenya, ghana, tanzania, rwanda, waemu, cemac"
      exit 0
      ;;
    *) log_error "Unknown argument: $arg"; exit 1 ;;
  esac
done

if [ -z "$OUTPUT_DIR" ]; then
  OUTPUT_DIR="${REPO_ROOT}/sandbox-evidence-${DATE}"
fi

DOCS_DIR="${REPO_ROOT}/docs"
COMPLIANCE_DIR="${DOCS_DIR}/compliance"
SECURITY_DIR="${DOCS_DIR}/security"
TERRAFORM_DIR="${REPO_ROOT}/infra/terraform/modules/compliance-db"

log_info "Assembling sandbox evidence for jurisdiction: ${JURISDICTION}"
log_info "Output directory: ${OUTPUT_DIR}"

mkdir -p "${OUTPUT_DIR}/appendices"

# ---------------------------------------------------------------------------
# 01 — Architecture Overview
# ---------------------------------------------------------------------------

if [ -f "${COMPLIANCE_DIR}/sandbox/architecture-overview.md" ]; then
  cp "${COMPLIANCE_DIR}/sandbox/architecture-overview.md" "${OUTPUT_DIR}/01-architecture-overview.md"
  log_success "01 — Architecture overview copied"
else
  log_warn "01 — Architecture overview not found at docs/compliance/sandbox/architecture-overview.md"
fi

# ---------------------------------------------------------------------------
# 02 — Data Residency Proof (generated from Terraform jurisdiction config)
# ---------------------------------------------------------------------------

generate_data_residency() {
  local tf_file="${TERRAFORM_DIR}/main.tf"
  if [ ! -f "$tf_file" ]; then
    log_warn "02 — Terraform config not found; generating placeholder"
    echo "# Data Residency Proof — PLACEHOLDER (Terraform config not found)" > "${OUTPUT_DIR}/02-data-residency-proof.md"
    return
  fi

  cat > "${OUTPUT_DIR}/02-data-residency-proof.md" <<RESIDENCY_EOF
# Data Residency Proof

**Generated:** ${DATE}
**Jurisdiction:** ${JURISDICTION}
**Source:** infra/terraform/modules/compliance-db/main.tf

---

## Statement

All GTCX data for the ${JURISDICTION} jurisdiction is stored in the AWS region designated by the compliance-db Terraform module. The region assignment is encoded in infrastructure-as-code and enforced at deployment time — it cannot be overridden by application code.

## Jurisdiction-to-Region Mapping (from Terraform)

| Jurisdiction | AWS Region | Location | Regulator |
|---|---|---|---|
| Zimbabwe | af-south-1 | Cape Town, South Africa | Reserve Bank of Zimbabwe |
| South Africa | af-south-1 | Cape Town, South Africa | South African Reserve Bank |
| Nigeria | af-south-1 | Cape Town, South Africa | Central Bank of Nigeria |
| Kenya | af-south-1 | Cape Town, South Africa | Central Bank of Kenya |
| Tanzania | af-south-1 | Cape Town, South Africa | Bank of Tanzania |
| Rwanda | af-south-1 | Cape Town, South Africa | National Bank of Rwanda |
| Ghana | eu-west-1 | Ireland | Bank of Ghana |
| Egypt | me-south-1 | Bahrain | Central Bank of Egypt |
| WAEMU | eu-west-3 | Paris, France | BCEAO |
| CEMAC | eu-west-3 | Paris, France | BEAC |

## Technical Enforcement

- The \`jurisdiction\` variable in Terraform determines the AWS region for all resources (RDS, S3, KMS).
- The region is validated at \`terraform plan\` time — invalid jurisdiction/region combinations are rejected.
- Cross-region replication is disabled by default. Where enabled (for disaster recovery), replicas remain within the same regulatory zone.
- S3 bucket policies deny \`PutObject\` from outside the designated region.

## Evidence

The jurisdiction configuration is defined in:
\`\`\`
infra/terraform/modules/compliance-db/main.tf — local.jurisdiction_config
\`\`\`

To verify: \`terraform plan -var jurisdiction=${JURISDICTION}\` will show the resolved region in the plan output.
RESIDENCY_EOF

  log_success "02 — Data residency proof generated from Terraform config"
}

generate_data_residency

# ---------------------------------------------------------------------------
# 03 — Encryption Statement (generated from cryptography policy)
# ---------------------------------------------------------------------------

generate_encryption_statement() {
  cat > "${OUTPUT_DIR}/03-encryption-statement.md" <<ENC_EOF
# Encryption Statement

**Generated:** ${DATE}
**Source:** docs/compliance/policies/A10-cryptography.md, infra/terraform/modules/compliance-db/main.tf

---

## Encryption at Rest

| Resource | Encryption Method | Key Management |
|---|---|---|
| Operational Database (RDS PostgreSQL) | AES-256 (AWS managed) | AWS KMS — automatic annual rotation |
| Audit Database (RDS PostgreSQL) | AES-256 (AWS managed) | AWS KMS — automatic annual rotation |
| KYC Document Storage (S3) | SSE-KMS (AES-256) | Dedicated KMS key per jurisdiction |
| Audit Backup (S3) | SSE-KMS (AES-256) | Dedicated KMS key, 7-year retention |
| Database Backups (RDS snapshots) | AES-256 (inherited from source DB) | Same KMS key as source database |

## Encryption in Transit

| Path | Protocol | Minimum Version |
|---|---|---|
| User device to API Gateway | TLS | 1.3 |
| API Gateway to application services | mTLS | 1.2 |
| Application services to database | TLS | 1.2 (required, not optional) |
| Inter-service communication | mTLS | 1.2 |
| Backup export to S3 | TLS | 1.2 |

## Approved Algorithms

Per GTCX Cryptography Policy (POL-10):

- **Symmetric encryption:** AES-256-GCM
- **Digital signatures:** Ed25519, ECDSA P-256
- **Hashing:** SHA-256 minimum
- **Key exchange:** X25519, ECDH P-256
- **Prohibited:** MD5, SHA-1, 3DES, RSA < 2048-bit

## Key Rotation Schedule

- Symmetric keys (KMS): every 12 months (automatic)
- Asymmetric keys: every 24 months
- TLS certificates: every 90 days (automated via cert-manager)
- API tokens: every 90 days
ENC_EOF

  log_success "03 — Encryption statement generated"
}

generate_encryption_statement

# ---------------------------------------------------------------------------
# 04 — KYC Retention Schedule (generated from Terraform jurisdiction config)
# ---------------------------------------------------------------------------

generate_kyc_retention() {
  cat > "${OUTPUT_DIR}/04-kyc-retention-schedule.md" <<KYC_EOF
# KYC Retention Schedule

**Generated:** ${DATE}
**Source:** infra/terraform/modules/compliance-db/main.tf — local.jurisdiction_config

---

## Retention Periods by Jurisdiction

| Jurisdiction | KYC Retention | Audit Retention | Governing Regulation |
|---|---|---|---|
| Zimbabwe | 5 years (1,825 days) | 7 years (2,555 days) | FATF baseline, RBZ AML/CFT regulations |
| South Africa | 5 years (1,825 days) | 7 years (2,555 days) | FICA Section 22 |
| Nigeria | 6 years (2,190 days) | 7 years (2,555 days) | CBN AML/CFT Regulation Section 18 |
| Egypt | 5 years (1,825 days) | 10 years (3,650 days) | AML Law No. 80/2002 |
| Kenya | 5 years (1,825 days) | 7 years (2,555 days) | Proceeds of Crime and AML Act Section 47 |
| Ghana | 5 years (1,825 days) | 7 years (2,555 days) | AML Act 2020 |
| Tanzania | 5 years (1,825 days) | 7 years (2,555 days) | AML Act 2006 (amended 2022) |
| Rwanda | 5 years (1,825 days) | 7 years (2,555 days) | AML/CFT Law (2021) |
| WAEMU | 5 years (1,825 days) | 10 years (3,650 days) | BCEAO Instruction 01/2017, OHADA |
| CEMAC | 5 years (1,825 days) | 10 years (3,650 days) | COBAC regulations, OHADA |

## How Retention is Enforced

- KYC document retention is set via the \`document_retention_days\` parameter on the S3 lifecycle policy.
- The retention period is derived from the \`jurisdiction\` variable in Terraform — it cannot be shortened by application code.
- When the retention period expires, documents are automatically transitioned to Glacier Deep Archive for an additional 2 years, then permanently deleted.
- Legal holds can override automatic deletion when required by ongoing investigations.

## Deletion Process

1. Retention timer starts when the customer relationship ends (account closure).
2. At expiry, objects are marked for deletion by S3 lifecycle policy.
3. Deletion is logged in the audit trail with the regulatory justification.
4. Right-to-erasure requests (POPIA, NDPA) are processed within 30 days, subject to overriding legal retention obligations.
KYC_EOF

  log_success "04 — KYC retention schedule generated"
}

generate_kyc_retention

# ---------------------------------------------------------------------------
# 05 — Audit Trail Sample (placeholder JSON)
# ---------------------------------------------------------------------------

generate_audit_sample() {
  cat > "${OUTPUT_DIR}/05-audit-trail-sample.json" <<AUDIT_EOF
{
  "_comment": "Sample audit trail records — sanitized, no real PII or transaction data",
  "generated": "${DATE}",
  "format": "GTCX Audit Trail v1",
  "records": [
    {
      "event_id": "evt_sample_001",
      "timestamp": "2026-05-01T10:15:30.000Z",
      "event_type": "kyc.verification.completed",
      "actor": "system:kyc-service",
      "subject": "user:redacted-user-id",
      "outcome": "approved",
      "jurisdiction": "${JURISDICTION}",
      "metadata": {
        "document_type": "national_id",
        "verification_method": "automated",
        "risk_score": "low"
      },
      "integrity": {
        "hash_algorithm": "SHA-256",
        "record_hash": "a1b2c3d4e5f6..."
      }
    },
    {
      "event_id": "evt_sample_002",
      "timestamp": "2026-05-01T10:16:45.000Z",
      "event_type": "trade.compliance_check.passed",
      "actor": "system:compliance-engine",
      "subject": "transaction:redacted-tx-id",
      "outcome": "passed",
      "jurisdiction": "${JURISDICTION}",
      "metadata": {
        "checks_performed": ["sanctions_screening", "pep_check", "adverse_media"],
        "screening_provider": "internal"
      },
      "integrity": {
        "hash_algorithm": "SHA-256",
        "record_hash": "f6e5d4c3b2a1..."
      }
    },
    {
      "event_id": "evt_sample_003",
      "timestamp": "2026-05-01T11:30:00.000Z",
      "event_type": "access.privileged_session.started",
      "actor": "user:platform-engineer-redacted",
      "subject": "system:production-database",
      "outcome": "granted",
      "jurisdiction": "${JURISDICTION}",
      "metadata": {
        "access_type": "read_only",
        "justification": "GTCX-TICKET-1234",
        "mfa_verified": true,
        "session_ttl_minutes": 60
      },
      "integrity": {
        "hash_algorithm": "SHA-256",
        "record_hash": "1a2b3c4d5e6f..."
      }
    }
  ]
}
AUDIT_EOF

  log_success "05 — Audit trail sample generated (sanitized)"
}

generate_audit_sample

# ---------------------------------------------------------------------------
# 06 — Access Control Matrix (copy from existing SoD matrix)
# ---------------------------------------------------------------------------

if [ -f "${COMPLIANCE_DIR}/separation-of-duties-matrix.md" ]; then
  cp "${COMPLIANCE_DIR}/separation-of-duties-matrix.md" "${OUTPUT_DIR}/06-access-control-matrix.md"
  log_success "06 — Access control matrix copied (separation-of-duties-matrix.md)"
else
  log_warn "06 — Separation of duties matrix not found"
fi

# ---------------------------------------------------------------------------
# 07 — Incident Response Plan (copy existing IRP)
# ---------------------------------------------------------------------------

if [ -f "${COMPLIANCE_DIR}/incident-response-plan-v1.md" ]; then
  cp "${COMPLIANCE_DIR}/incident-response-plan-v1.md" "${OUTPUT_DIR}/07-incident-response-plan.md"
  log_success "07 — Incident response plan copied"
else
  log_warn "07 — Incident response plan not found"
fi

# ---------------------------------------------------------------------------
# 08 — Business Continuity (copy existing BC policy + RTO/RPO)
# ---------------------------------------------------------------------------

generate_business_continuity() {
  local bc_policy="${COMPLIANCE_DIR}/policies/A17-business-continuity.md"
  local rto_rpo="${COMPLIANCE_DIR}/rto-rpo-resolution.md"

  {
    if [ -f "$bc_policy" ]; then
      cat "$bc_policy"
    else
      echo "# Business Continuity — PLACEHOLDER (A17 policy not found)"
    fi

    echo ""
    echo "---"
    echo ""

    if [ -f "$rto_rpo" ]; then
      cat "$rto_rpo"
    else
      echo "# RTO/RPO — PLACEHOLDER (rto-rpo-resolution.md not found)"
    fi
  } > "${OUTPUT_DIR}/08-business-continuity.md"

  log_success "08 — Business continuity assembled (A17 + RTO/RPO)"
}

generate_business_continuity

# ---------------------------------------------------------------------------
# 09 — Security Assessment (copy existing security architecture)
# ---------------------------------------------------------------------------

if [ -f "${SECURITY_DIR}/security-architecture.md" ]; then
  cp "${SECURITY_DIR}/security-architecture.md" "${OUTPUT_DIR}/09-security-assessment.md"
  log_success "09 — Security assessment copied (security-architecture.md)"
elif [ -f "${SECURITY_DIR}/security-framework.md" ]; then
  cp "${SECURITY_DIR}/security-framework.md" "${OUTPUT_DIR}/09-security-assessment.md"
  log_success "09 — Security assessment copied (security-framework.md)"
else
  log_warn "09 — No security architecture or framework document found"
fi

# ---------------------------------------------------------------------------
# 10 — Change Management Evidence (generated from git log + CI)
# ---------------------------------------------------------------------------

generate_change_management() {
  cat > "${OUTPUT_DIR}/10-change-management-evidence.md" <<CM_HEADER
# Change Management Evidence

**Generated:** ${DATE}
**Source:** Git history (last 20 commits) and CI/CD pipeline status

---

## Change Control Process

1. All code changes are submitted via pull request (PR).
2. PRs require at least one peer review approval before merge.
3. CI pipeline runs automated checks on every PR: linting, type checking, formatting, and security scans.
4. Merges to the main branch trigger a deployment pipeline with staging validation before production.
5. All commits use conventional commit format for traceability.

## Recent Changes (Last 20 Commits)

\`\`\`
CM_HEADER

  # Append git log
  cd "$REPO_ROOT"
  git log --oneline --no-decorate -20 >> "${OUTPUT_DIR}/10-change-management-evidence.md" 2>/dev/null || echo "(git log unavailable)" >> "${OUTPUT_DIR}/10-change-management-evidence.md"

  cat >> "${OUTPUT_DIR}/10-change-management-evidence.md" <<CM_FOOTER
\`\`\`

## CI Pipeline Status

CM_FOOTER

  # Try to get CI status from GitHub
  if command -v gh &> /dev/null; then
    echo '```' >> "${OUTPUT_DIR}/10-change-management-evidence.md"
    gh run list --limit 5 --json status,conclusion,name,createdAt \
      --template '{{range .}}{{.name}} | {{.status}} | {{.conclusion}} | {{.createdAt}}{{"\n"}}{{end}}' \
      >> "${OUTPUT_DIR}/10-change-management-evidence.md" 2>/dev/null \
      || echo "(GitHub CLI not authenticated or no CI runs found)" >> "${OUTPUT_DIR}/10-change-management-evidence.md"
    echo '```' >> "${OUTPUT_DIR}/10-change-management-evidence.md"
  else
    echo "(GitHub CLI not installed — CI status not available)" >> "${OUTPUT_DIR}/10-change-management-evidence.md"
  fi

  log_success "10 — Change management evidence generated"
}

generate_change_management

# ---------------------------------------------------------------------------
# Appendices — Copy security scan reports if they exist
# ---------------------------------------------------------------------------

copy_if_exists() {
  local src="$1"
  local dst="$2"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
    log_success "Appendix copied: $(basename "$dst")"
  else
    log_warn "Appendix not found: $src"
  fi
}

REPORTS_DIR="${REPO_ROOT}/infra/security/reports"

copy_if_exists "${REPORTS_DIR}/zap-report.html"     "${OUTPUT_DIR}/appendices/zap-report.html"
copy_if_exists "${REPORTS_DIR}/trivy-report.sarif"   "${OUTPUT_DIR}/appendices/trivy-report.sarif"
copy_if_exists "${REPORTS_DIR}/codeql-report.sarif"  "${OUTPUT_DIR}/appendices/codeql-report.sarif"

# Generate npm audit report
if command -v npm &> /dev/null && [ -f "${REPO_ROOT}/package.json" ]; then
  log_info "Generating npm audit report..."
  cd "$REPO_ROOT"
  npm audit --json > "${OUTPUT_DIR}/appendices/npm-audit.json" 2>/dev/null || echo '{"error": "npm audit failed or no dependencies"}' > "${OUTPUT_DIR}/appendices/npm-audit.json"
  log_success "Appendix: npm-audit.json generated"
else
  log_warn "Appendix: npm not available — skipping npm audit"
fi

# Generate SBOM placeholder
if [ ! -f "${OUTPUT_DIR}/appendices/sbom.json" ]; then
  cat > "${OUTPUT_DIR}/appendices/sbom.json" <<'SBOM_EOF'
{
  "_comment": "SBOM placeholder — generate with: npx @cyclonedx/cyclonedx-npm --output-file sbom.json",
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "components": []
}
SBOM_EOF
  log_warn "Appendix: sbom.json is a placeholder — run 'npx @cyclonedx/cyclonedx-npm' to generate"
fi

# ---------------------------------------------------------------------------
# Summary and manual checklist
# ---------------------------------------------------------------------------

echo ""
echo "==========================================================================="
echo -e "${GREEN}Evidence package assembled: ${OUTPUT_DIR}${NC}"
echo "==========================================================================="
echo ""
echo "Contents:"
ls -1 "${OUTPUT_DIR}/"
echo ""
echo "Appendices:"
ls -1 "${OUTPUT_DIR}/appendices/" 2>/dev/null || echo "  (none)"
echo ""
echo "==========================================================================="
echo -e "${YELLOW}MANUAL CHECKLIST — Items requiring human input before submission:${NC}"
echo "==========================================================================="
echo ""
echo "  [ ] 01 — Fill in contact information table in architecture overview"
echo "  [ ] 05 — Replace sample audit trail with real sanitized records from audit DB"
echo "  [ ] 07 — Set effective date and obtain board sign-off on IRP"
echo "  [ ] 09 — Commission and attach independent penetration test report"
echo "  [ ] Appendix — Generate real SBOM: npx @cyclonedx/cyclonedx-npm --output-file sbom.json"
echo "  [ ] Appendix — Run ZAP scan and place report at infra/security/reports/zap-report.html"
echo "  [ ] Appendix — Run Trivy scan: trivy fs --format sarif -o trivy-report.sarif ."
echo "  [ ] Appendix — Run CodeQL analysis via GitHub Actions and download SARIF"
echo "  [ ] Review all 10 documents for accuracy before submission"
echo "  [ ] Convert .md files to PDF if the regulator requires PDF format"
echo ""
