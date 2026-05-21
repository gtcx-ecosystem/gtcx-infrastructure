# =============================================================================
# Jurisdiction Plugin Template
# =============================================================================
# Copy this file, rename to <jurisdiction>.tf, fill the values. Every field
# must cite its regulatory source in `notes` — the audit trail begins here.
# =============================================================================

locals {
  jurisdiction_plugin_template = {
    # AWS region. Pick the closest in-region option. Data sovereignty obligations
    # in many African jurisdictions require in-country or in-bloc storage.
    region = "af-south-1"

    # Customer due-diligence record retention floor (days).
    # Source: regulator AML/CFT regulation or FATF mutual-evaluation report.
    kyc_retention_days = 1825 # 5 years — FATF baseline

    # Transaction + audit record retention floor (days).
    # Source: financial-services act, companies act, or tax-administration act.
    # MUST be ≥ kyc_retention_days; the compliance-db tests enforce this.
    audit_retention_days = 2555 # 7 years — common Companies Act baseline

    # Short code for the primary financial regulator (e.g. "RBZ", "CBN", "SARB").
    regulator = "TODO"

    # Full legal name of the regulator.
    regulator_full = "TODO"

    # Name of the data-protection statute that applies.
    data_protection_law = "TODO"

    # Authority responsible for data-protection enforcement.
    data_protection_authority = "TODO"

    # Whether cross-border transfer of operational data is permitted at all.
    cross_border_allowed = false

    # Conditions, if any, attached to cross-border transfers.
    cross_border_conditions = "TODO"

    # Free-form notes. Cite the specific regulation, section, and date.
    # Reviewers verify against the cited source before merging.
    notes = <<-EOT
      TODO: cite specific regulator circular, act section, and year.
      Example: "RBZ National Payment Systems Directive, Section 18 (2024 revision)."
    EOT
  }
}
