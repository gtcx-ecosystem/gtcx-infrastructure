-- =============================================================================
-- GTCX Protocol Tables — TradePass & GeoTag
-- =============================================================================
-- Protocol-layer tables for sovereign identity credentials (TradePass) and
-- geospatial verification proofs (GeoTag).
--
-- These tables use VARCHAR PKs (DID-derived or protocol-generated IDs) rather
-- than UUID PKs — protocol identifiers are externally generated and must be
-- preserved as-is for cryptographic verification.
--
-- Per SOVEREIGN (6): Schema is jurisdiction-agnostic; config drives behavior
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRADEPASS: Verifiable Credentials
-- =============================================================================

CREATE TABLE IF NOT EXISTS tradepass_credentials (
  id                    VARCHAR(128) PRIMARY KEY,
  credential_json       JSONB NOT NULL,
  issuer_did            VARCHAR(256) NOT NULL,
  subject_did           VARCHAR(256) NOT NULL,
  credential_type       VARCHAR(128) NOT NULL,
  status                VARCHAR(32) NOT NULL DEFAULT 'active',
  issued_at             TIMESTAMPTZ NOT NULL,
  expires_at            TIMESTAMPTZ,
  revoked_at            TIMESTAMPTZ,
  revocation_reason     TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_tradepass_cred_status CHECK (status IN ('active', 'revoked', 'expired', 'suspended'))
);

-- =============================================================================
-- TRADEPASS: Decentralized Identities
-- =============================================================================

CREATE TABLE IF NOT EXISTS tradepass_identities (
  did                   VARCHAR(256) PRIMARY KEY,
  trade_pass_id         VARCHAR(32) UNIQUE,
  name                  VARCHAR(256),
  role                  VARCHAR(64),
  jurisdiction          VARCHAR(8) NOT NULL,
  public_key            VARCHAR(512),
  status                VARCHAR(32) NOT NULL DEFAULT 'pending',
  identity_json         JSONB NOT NULL,
  kyc_document_type     VARCHAR(64),
  kyc_document_ref      VARCHAR(512),
  kyc_document_status   VARCHAR(16),
  kyc_verified_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- GEOTAG: Geospatial Proofs
-- =============================================================================

CREATE TABLE IF NOT EXISTS geotag_proofs (
  id                    VARCHAR(128) PRIMARY KEY,
  proof_json            JSONB NOT NULL,
  operator_did          VARCHAR(256) NOT NULL,
  site_id               VARCHAR(128),
  latitude              DECIMAL(10,7) NOT NULL,
  longitude             DECIMAL(10,7) NOT NULL,
  accuracy              DECIMAL(8,2) NOT NULL,
  source                VARCHAR(16) NOT NULL,
  commodity_type        VARCHAR(64),
  chain_hash            VARCHAR(128) NOT NULL,
  jurisdiction          VARCHAR(8),
  recorded_at           TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_geotag_source CHECK (source IN ('gps', 'cell', 'wifi', 'nfc', 'manual'))
);

-- =============================================================================
-- GEOTAG: Sites & Geofences
-- =============================================================================

CREATE TABLE IF NOT EXISTS geotag_sites (
  id                              VARCHAR(128) PRIMARY KEY,
  name                            VARCHAR(256) NOT NULL,
  site_type                       VARCHAR(64) NOT NULL,
  geofence                        JSONB NOT NULL,
  jurisdiction                    VARCHAR(8) NOT NULL,
  operator_did                    VARCHAR(256),
  commodity_types                 JSONB,
  estimated_monthly_capacity_kg   DECIMAL(12,3),
  allowed_grades                  JSONB,
  min_assay_purity                DECIMAL(5,4),
  status                          VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Foreign Key Constraints
-- =============================================================================

ALTER TABLE tradepass_credentials
  ADD CONSTRAINT fk_tradepass_cred_issuer
  FOREIGN KEY (issuer_did) REFERENCES tradepass_identities(did) ON DELETE RESTRICT;

ALTER TABLE tradepass_credentials
  ADD CONSTRAINT fk_tradepass_cred_subject
  FOREIGN KEY (subject_did) REFERENCES tradepass_identities(did) ON DELETE RESTRICT;

ALTER TABLE geotag_proofs
  ADD CONSTRAINT fk_geotag_proofs_operator
  FOREIGN KEY (operator_did) REFERENCES tradepass_identities(did) ON DELETE RESTRICT;

ALTER TABLE geotag_proofs
  ADD CONSTRAINT fk_geotag_proofs_site
  FOREIGN KEY (site_id) REFERENCES geotag_sites(id) ON DELETE SET NULL;

ALTER TABLE geotag_sites
  ADD CONSTRAINT fk_geotag_sites_operator
  FOREIGN KEY (operator_did) REFERENCES tradepass_identities(did) ON DELETE SET NULL;

-- =============================================================================
-- Indexes — TradePass
-- =============================================================================

CREATE INDEX idx_tradepass_cred_subject ON tradepass_credentials(subject_did);
CREATE INDEX idx_tradepass_cred_issuer ON tradepass_credentials(issuer_did);
CREATE INDEX idx_tradepass_cred_status ON tradepass_credentials(status);
CREATE INDEX idx_tradepass_cred_type ON tradepass_credentials(credential_type);
CREATE INDEX idx_tradepass_cred_subject_status ON tradepass_credentials(subject_did, status);

CREATE INDEX idx_tradepass_identity_jurisdiction ON tradepass_identities(jurisdiction);
CREATE INDEX idx_tradepass_identity_status ON tradepass_identities(status);
CREATE UNIQUE INDEX idx_tradepass_identity_trade_pass_id ON tradepass_identities(trade_pass_id) WHERE trade_pass_id IS NOT NULL;
CREATE INDEX idx_tradepass_identity_kyc_status ON tradepass_identities(kyc_document_status) WHERE kyc_document_status IS NOT NULL;

-- =============================================================================
-- Indexes — GeoTag
-- =============================================================================

CREATE INDEX idx_geotag_proofs_operator ON geotag_proofs(operator_did);
CREATE INDEX idx_geotag_proofs_site ON geotag_proofs(site_id);
CREATE INDEX idx_geotag_proofs_operator_time ON geotag_proofs(operator_did, recorded_at);
CREATE INDEX idx_geotag_proofs_site_time ON geotag_proofs(site_id, recorded_at);
CREATE INDEX idx_geotag_proofs_coords ON geotag_proofs(latitude, longitude);

CREATE INDEX idx_geotag_sites_jurisdiction ON geotag_sites(jurisdiction);
CREATE INDEX idx_geotag_sites_type ON geotag_sites(site_type);
CREATE INDEX idx_geotag_sites_status ON geotag_sites(status);
CREATE INDEX idx_geotag_sites_operator ON geotag_sites(operator_did) WHERE operator_did IS NOT NULL;

-- =============================================================================
-- Triggers — updated_at auto-update
-- =============================================================================

CREATE TRIGGER trg_tradepass_credentials_updated_at
  BEFORE UPDATE ON tradepass_credentials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tradepass_identities_updated_at
  BEFORE UPDATE ON tradepass_identities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_geotag_sites_updated_at
  BEFORE UPDATE ON geotag_sites
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
