-- =============================================================================
-- Sprint 63 Schema Additions (2026-03-27)
-- =============================================================================
-- Adds columns that were added to the 6-platforms TypeORM entities after the
-- initial 01-schema.sql / 02-protocol-tables.sql were applied.
--
-- All statements use ADD COLUMN IF NOT EXISTS for idempotency — safe to re-run.
--
-- Tables modified:
--   tradepass_identities     — trade_pass_id, name, role, public_key (pre-63 gap)
--                              + KYC document intake fields (Sprint 63)
--   geotag_sites             — operator_did (pre-63 gap)
--                              + production capacity fields (Sprint 63)
--   sgx_export_applications  — clearance_authority_id, gci_score_at_submission
-- =============================================================================

-- =============================================================================
-- TRADEPASS: Identity columns
-- =============================================================================
-- Pre-Sprint 63: trade_pass_id, name, role, public_key were added to the entity
-- but were not reflected in 02-protocol-tables.sql.

ALTER TABLE tradepass_identities
  ADD COLUMN IF NOT EXISTS trade_pass_id       VARCHAR(32),
  ADD COLUMN IF NOT EXISTS name                VARCHAR(256),
  ADD COLUMN IF NOT EXISTS role                VARCHAR(64),
  ADD COLUMN IF NOT EXISTS public_key          VARCHAR(512);

-- Sprint 63: KYC document intake — type, external reference, screening status,
-- and verified timestamp. Status is synced by the AML/KYC screening pipeline.

ALTER TABLE tradepass_identities
  ADD COLUMN IF NOT EXISTS kyc_document_type   VARCHAR(64),
  ADD COLUMN IF NOT EXISTS kyc_document_ref    VARCHAR(512),
  ADD COLUMN IF NOT EXISTS kyc_document_status VARCHAR(16),
  ADD COLUMN IF NOT EXISTS kyc_verified_at     TIMESTAMPTZ;

-- Index: fast lookup of identities pending KYC review
CREATE INDEX IF NOT EXISTS idx_tradepass_identity_kyc_status
  ON tradepass_identities(kyc_document_status)
  WHERE kyc_document_status IS NOT NULL;

-- Index: trade_pass_id lookup (used by registerIdentity + getIdentity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tradepass_identity_trade_pass_id
  ON tradepass_identities(trade_pass_id)
  WHERE trade_pass_id IS NOT NULL;

-- =============================================================================
-- GEOTAG: Site columns
-- =============================================================================
-- Pre-Sprint 63: operator_did was in the entity but missing from the init script.

ALTER TABLE geotag_sites
  ADD COLUMN IF NOT EXISTS operator_did                    VARCHAR(256);

-- Sprint 63: Production capacity — declared by operator at site registration.
-- Feeds the GCI financial factor (production data quality score).
-- Units are always kg; convert at the API layer.

ALTER TABLE geotag_sites
  ADD COLUMN IF NOT EXISTS estimated_monthly_capacity_kg  DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS allowed_grades                 JSONB,
  ADD COLUMN IF NOT EXISTS min_assay_purity               DECIMAL(5,4);

-- Index: operator → sites lookup (used by listSites)
CREATE INDEX IF NOT EXISTS idx_geotag_sites_operator
  ON geotag_sites(operator_did)
  WHERE operator_did IS NOT NULL;

-- =============================================================================
-- SGX: Export Application columns
-- =============================================================================
-- Sprint 63: GCI gate — score snapshot and resolved clearance authority.
-- clearance_authority_id is an opaque ID (e.g. 'ZW-GOLD-001'); the
-- human-readable name is never stored here (ADR-020 D3).

ALTER TABLE sgx_export_applications
  ADD COLUMN IF NOT EXISTS clearance_authority_id    VARCHAR(64),
  ADD COLUMN IF NOT EXISTS gci_score_at_submission   DECIMAL(5,2);

-- Index: filter applications by clearance authority (regulator dashboard)
CREATE INDEX IF NOT EXISTS idx_sgx_apps_clearance_authority
  ON sgx_export_applications(clearance_authority_id)
  WHERE clearance_authority_id IS NOT NULL;

-- Index: GCI gate reporting — identify PENDING_REVIEW applications and their scores
CREATE INDEX IF NOT EXISTS idx_sgx_apps_status_gci
  ON sgx_export_applications(status, gci_score_at_submission)
  WHERE status = 'PENDING_REVIEW';
