-- =============================================================================
-- GTCX Operational Database Schema
-- =============================================================================
-- Auto-generated from 6-platforms TypeORM entities.
-- All tables inherit base columns: id (UUID PK), created_at, updated_at, deleted_at.
--
-- Per AUDITABLE (3): Soft deletes via deleted_at — no data ever physically removed
-- Per SOVEREIGN (6): Schema is jurisdiction-agnostic; config drives behavior
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Helper: base columns macro (applied to every table)
-- -----------------------------------------------------------------------------
-- id            UUID PRIMARY KEY DEFAULT uuid_generate_v4()
-- created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- deleted_at    TIMESTAMPTZ

-- =============================================================================
-- SHARED: Jurisdiction Configuration
-- =============================================================================

CREATE TABLE jurisdiction_configs (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  jurisdiction_code           VARCHAR(8) NOT NULL UNIQUE,
  export_tax_rate             DECIMAL(6,4) NOT NULL DEFAULT 0.05,
  royalty_rate                DECIMAL(6,4) NOT NULL DEFAULT 0.05,
  transaction_fee_rate        DECIMAL(6,4) NOT NULL DEFAULT 0.01,
  community_levy_rate         DECIMAL(6,4) NOT NULL DEFAULT 0.01,
  agx_fee_rate                DECIMAL(6,4) NOT NULL DEFAULT 0.005,
  currency                    VARCHAR(8) NOT NULL DEFAULT 'USD',
  clearance_expiry_hours      INT NOT NULL DEFAULT 72,
  default_quota_value         INT NOT NULL DEFAULT 10000,
  gci_expedite_threshold      INT NOT NULL DEFAULT 80,
  gci_standard_threshold      INT NOT NULL DEFAULT 50,
  permit_validity_years       INT NOT NULL DEFAULT 1,
  verification_premium_rate   DECIMAL(6,4) NOT NULL DEFAULT 0.05,
  traceability_premium_rate   DECIMAL(6,4) NOT NULL DEFAULT 0.04,
  esg_premium_per_cert        DECIMAL(6,4) NOT NULL DEFAULT 0.02,
  esg_premium_cap             DECIMAL(6,4) NOT NULL DEFAULT 0.06,
  default_financing_amount_cents INT NOT NULL DEFAULT 50000,
  premium_tiers               JSONB,
  pathway_thresholds          JSONB
);

-- =============================================================================
-- SHARED: CaaS Ledger
-- =============================================================================

CREATE TABLE caas_ledger (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  permit_id             VARCHAR(64) NOT NULL,
  jurisdiction_code     VARCHAR(8) NOT NULL,
  commodity_id          VARCHAR(32) NOT NULL,
  quantity              DECIMAL(14,4) NOT NULL,
  unit                  VARCHAR(8) NOT NULL,
  caas_rate_per_unit    DECIMAL(10,4) NOT NULL,
  total_fee_cents       INT NOT NULL,
  gtcx_share_cents      INT NOT NULL,
  government_share_cents INT NOT NULL,
  currency              VARCHAR(8) NOT NULL,
  operator_did          VARCHAR(128) NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reconciled_at         TIMESTAMPTZ
);

-- =============================================================================
-- SHARED: GCI Computations
-- =============================================================================

CREATE TABLE gci_computations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  computed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  operator_did            VARCHAR(128) NOT NULL,
  commodity_type          VARCHAR(32),
  jurisdiction_code       VARCHAR(8) NOT NULL,
  score                   DECIMAL(6,2) NOT NULL,
  category                VARCHAR(20) NOT NULL,
  environmental_score     DECIMAL(6,2) NOT NULL,
  safety_score            DECIMAL(6,2) NOT NULL,
  financial_score         DECIMAL(6,2) NOT NULL,
  social_score            DECIMAL(6,2) NOT NULL,
  regulatory_score        DECIMAL(6,2) NOT NULL,
  breakdown               JSONB NOT NULL,
  score_hash              VARCHAR(64) NOT NULL,
  computation_version     VARCHAR(16) NOT NULL,
  trend                   VARCHAR(20),
  panx_confirmed          BOOLEAN NOT NULL DEFAULT FALSE,
  computation_duration_ms INT NOT NULL DEFAULT 0,

  UNIQUE (operator_did, computation_version, commodity_type)
);

-- =============================================================================
-- AGX: Listings
-- =============================================================================

CREATE TABLE agx_listings (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,

  listing_number            VARCHAR NOT NULL UNIQUE,
  source_sgx                VARCHAR NOT NULL,
  source_lot_id             VARCHAR NOT NULL,
  export_clearance_id       VARCHAR NOT NULL,
  commodity_type            VARCHAR NOT NULL,
  quantity_value            DECIMAL(10,4) NOT NULL,
  quantity_unit             VARCHAR NOT NULL,
  purity                    DECIMAL(10,4) NOT NULL,
  assay_method              VARCHAR NOT NULL,
  assay_provider            VARCHAR NOT NULL,
  assay_certification_id    VARCHAR NOT NULL,
  gci_score                 DECIMAL(10,4) NOT NULL,
  base_price_cents          BIGINT NOT NULL,
  currency                  VARCHAR NOT NULL DEFAULT 'USD',
  verification_premium_rate DECIMAL(10,4) NOT NULL,
  compliance_premium_rate   DECIMAL(10,4) NOT NULL,
  traceability_premium_rate DECIMAL(10,4) NOT NULL,
  esg_premium_rate          DECIMAL(10,4) NOT NULL,
  total_premium_rate        DECIMAL(10,4) NOT NULL,
  premium_amount_cents      BIGINT NOT NULL,
  listing_price_cents       BIGINT NOT NULL,
  vault_id                  VARCHAR NOT NULL,
  vault_country             VARCHAR NOT NULL,
  delivery_terms            VARCHAR NOT NULL,
  status                    VARCHAR NOT NULL DEFAULT 'AVAILABLE',
  listed_at                 TIMESTAMPTZ NOT NULL,
  expires_at                TIMESTAMPTZ,

  CONSTRAINT agx_listings_status_check CHECK (
    status IN ('AVAILABLE', 'RESERVED', 'UNDER_CONTRACT', 'SETTLING', 'DELIVERED', 'EXPIRED')
  )
);

-- =============================================================================
-- AGX: Buyers
-- =============================================================================

CREATE TABLE agx_buyers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,

  buyer_number            VARCHAR NOT NULL UNIQUE,
  tradepass_id            VARCHAR NOT NULL,
  organization_type       VARCHAR NOT NULL,
  legal_name              VARCHAR NOT NULL,
  jurisdiction            VARCHAR NOT NULL,
  registration_number     VARCHAR NOT NULL,
  kyc_status              VARCHAR NOT NULL DEFAULT 'PENDING',
  aml_status              VARCHAR NOT NULL DEFAULT 'CLEAR',
  due_diligence_level     VARCHAR NOT NULL DEFAULT 'STANDARD',
  lbma_good_delivery      BOOLEAN NOT NULL DEFAULT FALSE,
  rjc_certified           BOOLEAN NOT NULL DEFAULT FALSE,
  oecd_compliant          BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_commodities   VARCHAR NOT NULL DEFAULT '',
  min_gci_threshold       DECIMAL(10,4) NOT NULL DEFAULT 0,
  accepted_payment_methods VARCHAR NOT NULL DEFAULT '',
  accepted_currencies     VARCHAR NOT NULL DEFAULT '',
  status                  VARCHAR NOT NULL DEFAULT 'ACTIVE',
  onboarded_at            TIMESTAMPTZ NOT NULL,

  CONSTRAINT agx_buyers_org_type_check CHECK (
    organization_type IN ('REFINER', 'MANUFACTURER', 'TRADER', 'INSTITUTION')
  ),
  CONSTRAINT agx_buyers_kyc_check CHECK (
    kyc_status IN ('PENDING', 'VERIFIED', 'ENHANCED', 'REJECTED')
  ),
  CONSTRAINT agx_buyers_aml_check CHECK (
    aml_status IN ('CLEAR', 'MONITORING', 'FLAGGED')
  ),
  CONSTRAINT agx_buyers_dd_check CHECK (
    due_diligence_level IN ('STANDARD', 'ENHANCED', 'COMPREHENSIVE')
  ),
  CONSTRAINT agx_buyers_status_check CHECK (
    status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')
  )
);

-- =============================================================================
-- AGX: Trades
-- =============================================================================

CREATE TABLE agx_trades (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,

  trade_number              VARCHAR NOT NULL UNIQUE,
  seller_id                 VARCHAR NOT NULL,
  seller_jurisdiction       VARCHAR NOT NULL,
  buyer_id                  UUID NOT NULL REFERENCES agx_buyers(id),
  buyer_jurisdiction        VARCHAR NOT NULL,
  listing_id                UUID NOT NULL REFERENCES agx_listings(id),
  commodity_type            VARCHAR NOT NULL,
  quantity_value            DECIMAL(10,4) NOT NULL,
  quantity_unit             VARCHAR NOT NULL,
  trade_value_cents         BIGINT NOT NULL,
  currency                  VARCHAR NOT NULL DEFAULT 'USD',
  premium_captured_cents    BIGINT NOT NULL,
  origin_government_fees_cents BIGINT NOT NULL,
  agx_fees_cents            BIGINT NOT NULL,
  pvp_transaction_id        VARCHAR,
  panx_consensus_id         VARCHAR,
  issuer_signature          TEXT,
  signer_did                VARCHAR,
  delivery_terms            VARCHAR NOT NULL,
  status                    VARCHAR NOT NULL DEFAULT 'MATCHED',
  executed_at               TIMESTAMPTZ NOT NULL,
  settled_at                TIMESTAMPTZ,
  delivered_at              TIMESTAMPTZ,

  CONSTRAINT agx_trades_status_check CHECK (
    status IN ('MATCHED', 'SETTLING', 'PAYMENT_CONFIRMED', 'SHIPPING', 'CUSTOMS_CLEARANCE', 'DELIVERED', 'COMPLETED', 'DISPUTED')
  )
);

-- =============================================================================
-- CRX: Permit Applications
-- =============================================================================

CREATE TABLE crx_permit_applications (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,

  application_number        VARCHAR NOT NULL UNIQUE,
  permit_type_code          VARCHAR NOT NULL,
  jurisdiction_code         VARCHAR NOT NULL,
  applicant_did             VARCHAR NOT NULL,
  applicant_role            VARCHAR NOT NULL,
  business_entity_name      VARCHAR,
  commodity_type_codes      VARCHAR NOT NULL,
  estimated_annual_volumes  TEXT,
  primary_activity          VARCHAR NOT NULL,
  geo_tag_proof_id          VARCHAR,
  site_latitude             DECIMAL(10,4),
  site_longitude            DECIMAL(10,4),
  area_hectares             DECIMAL(10,4),
  cadastre_reference        VARCHAR,
  gci_score_at_submission   DECIMAL(10,4),
  status                    VARCHAR NOT NULL DEFAULT 'SUBMITTED',
  processing_track          VARCHAR NOT NULL DEFAULT 'STANDARD',
  assigned_agency           VARCHAR,
  rejection_reason          TEXT,
  submitted_at              TIMESTAMPTZ NOT NULL,
  reviewed_at               TIMESTAMPTZ,

  CONSTRAINT crx_apps_activity_check CHECK (
    primary_activity IN ('EXTRACTION', 'PROCESSING', 'TRADING', 'CUSTODY')
  ),
  CONSTRAINT crx_apps_status_check CHECK (
    status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN')
  ),
  CONSTRAINT crx_apps_track_check CHECK (
    processing_track IN ('STANDARD', 'EXPEDITED', 'MANUAL_REVIEW')
  )
);

-- =============================================================================
-- CRX: Digital Permits
-- =============================================================================

CREATE TABLE crx_permits (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  permit_number         VARCHAR NOT NULL UNIQUE,
  permit_type_code      VARCHAR NOT NULL,
  holder_did            VARCHAR NOT NULL,
  holder_legal_name     VARCHAR NOT NULL,
  holder_role           VARCHAR NOT NULL,
  commodity_type_codes  VARCHAR NOT NULL,
  activities            VARCHAR NOT NULL,
  jurisdiction_code     VARCHAR NOT NULL,
  site_latitude         DECIMAL(10,4),
  site_longitude        DECIMAL(10,4),
  area_hectares         DECIMAL(10,4),
  cadastre_references   VARCHAR,
  volume_limits         TEXT,
  conditions            TEXT,
  issued_at             TIMESTAMPTZ NOT NULL,
  valid_from            TIMESTAMPTZ NOT NULL,
  valid_to              TIMESTAMPTZ NOT NULL,
  status                VARCHAR NOT NULL DEFAULT 'ACTIVE',
  issuer_signature      TEXT NOT NULL,
  application_id        UUID NOT NULL REFERENCES crx_permit_applications(id),

  CONSTRAINT crx_permits_status_check CHECK (
    status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED')
  )
);

-- =============================================================================
-- CRX: Compliance Alerts
-- =============================================================================

CREATE TABLE crx_compliance_alerts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  subject_type        VARCHAR NOT NULL,
  reference_id        VARCHAR NOT NULL,
  tradepass_did       VARCHAR,
  alert_type_code     VARCHAR NOT NULL,
  severity            VARCHAR NOT NULL,
  commodity_type_code VARCHAR,
  transaction_ref     VARCHAR,
  detection_method    VARCHAR NOT NULL,
  source_system       VARCHAR NOT NULL,
  detected_at         TIMESTAMPTZ NOT NULL,
  confidence          DECIMAL(10,4) NOT NULL,
  workflow_status     VARCHAR NOT NULL DEFAULT 'OPEN',
  assigned_to         VARCHAR,
  assigned_agency     VARCHAR,

  CONSTRAINT crx_alerts_subject_check CHECK (
    subject_type IN ('PERMIT', 'ACTOR', 'SITE', 'TRANSACTION')
  ),
  CONSTRAINT crx_alerts_severity_check CHECK (
    severity IN ('INFO', 'WARNING', 'VIOLATION', 'CRITICAL')
  ),
  CONSTRAINT crx_alerts_detection_check CHECK (
    detection_method IN ('AUTOMATED', 'MANUAL', 'EXTERNAL_REPORT')
  ),
  CONSTRAINT crx_alerts_workflow_check CHECK (
    workflow_status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED', 'CLOSED')
  )
);

-- =============================================================================
-- SGX: Export Quotas
-- =============================================================================

CREATE TABLE sgx_export_quotas (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  producer_id           VARCHAR NOT NULL,
  commodity_type        VARCHAR NOT NULL,
  jurisdiction_code     VARCHAR NOT NULL,
  period_start          TIMESTAMPTZ NOT NULL,
  period_end            TIMESTAMPTZ NOT NULL,
  quota_allotted_value  DECIMAL(10,4) NOT NULL,
  quota_allotted_unit   VARCHAR NOT NULL,
  quota_used_value      DECIMAL(10,4) NOT NULL DEFAULT 0,

  UNIQUE (producer_id, commodity_type, jurisdiction_code, period_start)
);

-- =============================================================================
-- SGX: Export Applications
-- =============================================================================

CREATE TABLE sgx_export_applications (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,

  application_number        VARCHAR NOT NULL UNIQUE,
  producer_id               VARCHAR NOT NULL,
  operator_id               VARCHAR NOT NULL,
  asset_id                  VARCHAR NOT NULL,
  commodity_type            VARCHAR NOT NULL,
  quantity_value            DECIMAL(10,4) NOT NULL,
  quantity_unit             VARCHAR NOT NULL,
  purity                    DECIMAL(10,4) NOT NULL,
  assay_method              VARCHAR NOT NULL,
  assay_provider            VARCHAR NOT NULL,
  assay_certification_id    VARCHAR NOT NULL,
  crx_permit_id             VARCHAR NOT NULL,
  vault_mark_custody_proof_id VARCHAR NOT NULL,
  jurisdiction_code         VARCHAR NOT NULL,
  clearance_authority_id    VARCHAR(64),
  gci_score_at_submission   DECIMAL(5,2),
  export_tax_cents          BIGINT NOT NULL DEFAULT 0,
  royalty_cents             BIGINT NOT NULL DEFAULT 0,
  transaction_fee_cents     BIGINT NOT NULL DEFAULT 0,
  community_levy_cents      BIGINT NOT NULL DEFAULT 0,
  total_tax_cents           BIGINT NOT NULL DEFAULT 0,
  tax_currency              VARCHAR NOT NULL DEFAULT 'USD',
  tax_calculated_at         TIMESTAMPTZ,
  quota_check_passed        BOOLEAN,
  quota_check_details       TEXT,
  status                    VARCHAR NOT NULL DEFAULT 'SUBMITTED',
  rejection_reason          TEXT,
  clearance_id              VARCHAR,
  submitted_at              TIMESTAMPTZ NOT NULL,
  reviewed_at               TIMESTAMPTZ,
  cleared_at                TIMESTAMPTZ,

  CONSTRAINT sgx_apps_status_check CHECK (
    status IN ('SUBMITTED', 'VALIDATING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')
  )
);

-- =============================================================================
-- SGX: Export Clearances
-- =============================================================================

CREATE TABLE sgx_export_clearances (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,

  clearance_number        VARCHAR NOT NULL UNIQUE,
  application_id          UUID NOT NULL REFERENCES sgx_export_applications(id),
  producer_id             VARCHAR NOT NULL,
  asset_id                VARCHAR NOT NULL,
  commodity_type          VARCHAR NOT NULL,
  quantity_value          DECIMAL(10,4) NOT NULL,
  quantity_unit           VARCHAR NOT NULL,
  export_tax_cents        BIGINT NOT NULL,
  royalty_cents           BIGINT NOT NULL,
  transaction_fee_cents   BIGINT NOT NULL,
  community_levy_cents    BIGINT NOT NULL,
  total_tax_cents         BIGINT NOT NULL,
  tax_currency            VARCHAR NOT NULL DEFAULT 'USD',
  revenue_collection_id   VARCHAR NOT NULL,
  issued_at               TIMESTAMPTZ NOT NULL,
  expires_at              TIMESTAMPTZ NOT NULL,
  issuing_officer_id      VARCHAR NOT NULL,
  jurisdiction_code       VARCHAR NOT NULL,
  issuer_signature        TEXT,
  signer_did              VARCHAR,
  agx_listing_id          VARCHAR
);

-- =============================================================================
-- Pathways: Producer Profiles
-- =============================================================================

CREATE TABLE pathways_producer_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  producer_did    VARCHAR NOT NULL UNIQUE,
  current_stage   INT NOT NULL DEFAULT 0,
  enrolled_at     TIMESTAMPTZ NOT NULL,
  graduated_at    TIMESTAMPTZ
);

-- =============================================================================
-- Pathways: Stage Transitions
-- =============================================================================

CREATE TABLE pathways_stage_transitions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  producer_profile_id UUID NOT NULL REFERENCES pathways_producer_profiles(id),
  from_stage          INT NOT NULL,
  to_stage            INT NOT NULL,
  transitioned_at     TIMESTAMPTZ NOT NULL,
  gate_results        TEXT NOT NULL,
  approved_by         VARCHAR
);

-- =============================================================================
-- Pathways: Milestones
-- =============================================================================

CREATE TABLE pathways_milestones (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  producer_profile_id   UUID NOT NULL REFERENCES pathways_producer_profiles(id),
  milestone_type        VARCHAR NOT NULL,
  stage_required        INT NOT NULL,
  verification_method   VARCHAR NOT NULL,
  evidence_ids          VARCHAR NOT NULL DEFAULT '',
  status                VARCHAR NOT NULL DEFAULT 'PENDING',
  verified_at           TIMESTAMPTZ,

  CONSTRAINT pathways_milestones_method_check CHECK (
    verification_method IN ('AUTO', 'FIELD_INSPECTION', 'DOCUMENT_REVIEW')
  ),
  CONSTRAINT pathways_milestones_status_check CHECK (
    status IN ('PENDING', 'VERIFIED', 'FAILED')
  )
);

-- =============================================================================
-- Pathways: Training Programs
-- =============================================================================

CREATE TABLE pathways_training_programs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  program_code        VARCHAR NOT NULL UNIQUE,
  title               VARCHAR NOT NULL,
  description         TEXT,
  category            VARCHAR NOT NULL,
  delivery_channels   VARCHAR NOT NULL DEFAULT '',
  languages           VARCHAR NOT NULL DEFAULT '',
  module_count        INT NOT NULL DEFAULT 1,
  estimated_minutes   INT NOT NULL DEFAULT 10,
  stage_minimum       INT NOT NULL DEFAULT 0,
  jurisdiction_code   VARCHAR,
  commodity_type      VARCHAR,
  active              BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT pathways_programs_category_check CHECK (
    category IN ('SAFETY', 'ENVIRONMENTAL', 'FINANCIAL_LITERACY', 'COMPLIANCE', 'ESG', 'TECHNICAL')
  )
);

-- =============================================================================
-- Pathways: Training Enrollments
-- =============================================================================

CREATE TABLE pathways_training_enrollments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  producer_profile_id   UUID NOT NULL REFERENCES pathways_producer_profiles(id),
  training_program_id   UUID NOT NULL REFERENCES pathways_training_programs(id),
  modules_completed     INT NOT NULL DEFAULT 0,
  quiz_score            INT NOT NULL DEFAULT 0,
  status                VARCHAR NOT NULL DEFAULT 'ENROLLED',
  enrolled_at           TIMESTAMPTZ NOT NULL,
  completed_at          TIMESTAMPTZ,

  CONSTRAINT pathways_enrollments_status_check CHECK (
    status IN ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED')
  )
);

-- =============================================================================
-- Pathways: Career Credentials
-- =============================================================================

CREATE TABLE pathways_career_credentials (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  credential_number     VARCHAR NOT NULL UNIQUE,
  producer_profile_id   UUID NOT NULL REFERENCES pathways_producer_profiles(id),
  producer_did          VARCHAR NOT NULL,
  credential_type       VARCHAR NOT NULL,
  program_code          VARCHAR NOT NULL,
  title                 VARCHAR NOT NULL,
  issuing_authority     TEXT,
  issued_at             TIMESTAMPTZ NOT NULL,
  expires_at            TIMESTAMPTZ,
  proof_hash            TEXT,
  proof_signature       TEXT,
  portable              BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================================================
-- Pathways: Financing Records
-- =============================================================================

CREATE TABLE pathways_financing_records (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  producer_profile_id   UUID NOT NULL REFERENCES pathways_producer_profiles(id),
  financing_type        VARCHAR NOT NULL,
  stage_gate            INT NOT NULL,
  amount_cents          BIGINT NOT NULL,
  currency              VARCHAR NOT NULL DEFAULT 'USD',
  provider_id           VARCHAR NOT NULL,
  disbursed_at          TIMESTAMPTZ,
  status                VARCHAR NOT NULL DEFAULT 'PENDING',

  CONSTRAINT pathways_financing_type_check CHECK (
    financing_type IN ('EQUIPMENT', 'WORKING_CAPITAL', 'TRAINING', 'INFRASTRUCTURE')
  ),
  CONSTRAINT pathways_financing_status_check CHECK (
    status IN ('PENDING', 'APPROVED', 'DISBURSED', 'REPAYING', 'COMPLETED')
  )
);

-- =============================================================================
-- Veritas: Index Values
-- =============================================================================

CREATE TABLE veritas_index_values (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,

  index_id                VARCHAR NOT NULL,
  index_name              VARCHAR NOT NULL,
  category                VARCHAR NOT NULL,
  value_cents             BIGINT NOT NULL,
  currency                VARCHAR NOT NULL DEFAULT 'USD',
  unit                    VARCHAR NOT NULL,
  transaction_count       INT NOT NULL,
  total_volume_kg         DECIMAL(10,4),
  average_gci             DECIMAL(10,4),
  price_low_cents         BIGINT,
  price_high_cents        BIGINT,
  change_absolute_cents   BIGINT,
  change_percentage       DECIMAL(10,4),
  methodology_version     VARCHAR NOT NULL,
  period                  VARCHAR NOT NULL,
  calculated_at           TIMESTAMPTZ NOT NULL,
  published_at            TIMESTAMPTZ,
  proof_signature         TEXT,
  anomaly_check_passed    BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT veritas_index_category_check CHECK (
    category IN ('price', 'production', 'compliance', 'supply')
  ),
  CONSTRAINT veritas_index_period_check CHECK (
    period IN ('daily', 'weekly', 'monthly')
  )
);

-- =============================================================================
-- Veritas: Attestations
-- =============================================================================

CREATE TABLE veritas_attestations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  attestation_number    VARCHAR NOT NULL UNIQUE,
  claim_type            VARCHAR NOT NULL,
  subject_type          VARCHAR NOT NULL,
  subject_id            VARCHAR NOT NULL,
  subject_metadata      TEXT,
  assertions            TEXT NOT NULL,
  overall_confidence    DECIMAL(10,4) NOT NULL DEFAULT 0,
  verified              BOOLEAN NOT NULL DEFAULT FALSE,
  proof_hash            VARCHAR,
  proof_signature       TEXT,
  signed_by             VARCHAR,
  certificate_url       VARCHAR,
  fee_cents             BIGINT NOT NULL DEFAULT 0,
  fee_currency          VARCHAR NOT NULL DEFAULT 'USD',
  status                VARCHAR NOT NULL DEFAULT 'PENDING',
  requested_by          VARCHAR NOT NULL,
  completed_at          TIMESTAMPTZ,

  CONSTRAINT veritas_attestations_status_check CHECK (
    status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DISPUTED')
  )
);

-- =============================================================================
-- Veritas: Protocol Events
-- =============================================================================

CREATE TABLE veritas_protocol_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  event_type        VARCHAR NOT NULL,
  source_protocol   VARCHAR NOT NULL,
  source_id         VARCHAR NOT NULL,
  subject_did       VARCHAR,
  commodity_type    VARCHAR,
  jurisdiction_code VARCHAR,
  event_data        TEXT NOT NULL,
  event_timestamp   TIMESTAMPTZ NOT NULL,
  ingested_at       TIMESTAMPTZ NOT NULL,
  processed         BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================================================
-- Veritas: Resolutions
-- =============================================================================

CREATE TABLE veritas_resolutions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,

  resolution_number       VARCHAR NOT NULL UNIQUE,
  resolution_type         VARCHAR NOT NULL,
  question                TEXT NOT NULL,
  parameters              TEXT NOT NULL,
  requester_platform      VARCHAR,
  requester_market_id     VARCHAR,
  outcome_value           TEXT,
  evidence_summary        TEXT,
  proof_hash              VARCHAR,
  proof_signature         TEXT,
  confidence              DECIMAL(10,4),
  fee_cents               BIGINT NOT NULL DEFAULT 0,
  fee_currency            VARCHAR NOT NULL DEFAULT 'USD',
  status                  VARCHAR NOT NULL DEFAULT 'PENDING',
  scheduled_for           TIMESTAMPTZ,
  resolved_at             TIMESTAMPTZ,
  dispute_window_ends_at  TIMESTAMPTZ,
  requested_by            VARCHAR NOT NULL,

  CONSTRAINT veritas_resolutions_type_check CHECK (
    resolution_type IN ('binary', 'continuous', 'threshold', 'multi_outcome')
  ),
  CONSTRAINT veritas_resolutions_status_check CHECK (
    status IN ('PENDING', 'SCHEDULED', 'PROCESSING', 'RESOLVED', 'DISPUTED')
  )
);

-- =============================================================================
-- Veritas: API Keys
-- =============================================================================

CREATE TABLE veritas_api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  key_hash        VARCHAR NOT NULL UNIQUE,
  key_prefix      VARCHAR NOT NULL,
  owner_did       VARCHAR NOT NULL,
  name            VARCHAR NOT NULL,
  status          VARCHAR NOT NULL DEFAULT 'active',
  tier            VARCHAR NOT NULL DEFAULT 'free',
  monthly_limit   INT NOT NULL DEFAULT 100,
  monthly_usage   INT NOT NULL DEFAULT 0,
  last_reset_at   TIMESTAMPTZ NOT NULL,
  expires_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,

  CONSTRAINT veritas_api_keys_status_check CHECK (
    status IN ('active', 'revoked', 'expired')
  ),
  CONSTRAINT veritas_api_keys_tier_check CHECK (
    tier IN ('free', 'professional', 'enterprise')
  )
);

-- =============================================================================
-- Veritas: Usage Records
-- =============================================================================

CREATE TABLE veritas_usage_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  api_key_id      VARCHAR NOT NULL,
  endpoint        VARCHAR NOT NULL,
  method          VARCHAR NOT NULL,
  status_code     INT NOT NULL DEFAULT 200,
  response_time_ms INT NOT NULL DEFAULT 0,
  requested_at    TIMESTAMPTZ NOT NULL
);

-- =============================================================================
-- Veritas: Webhooks
-- =============================================================================

CREATE TABLE veritas_webhooks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  owner_did         VARCHAR NOT NULL,
  url               VARCHAR NOT NULL,
  events            VARCHAR NOT NULL DEFAULT '',
  status            VARCHAR NOT NULL DEFAULT 'active',
  secret            VARCHAR,
  failure_count     INT NOT NULL DEFAULT 0,
  last_delivered_at TIMESTAMPTZ,
  last_failed_at    TIMESTAMPTZ,

  CONSTRAINT veritas_webhooks_status_check CHECK (
    status IN ('active', 'paused', 'disabled')
  )
);

-- =============================================================================
-- Operations: TapKit — Trace Points
-- =============================================================================

CREATE TABLE trace_points (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  asset_id        VARCHAR(255) NOT NULL,
  event_type      VARCHAR(30) NOT NULL,
  operator_did    VARCHAR(255) NOT NULL,
  location        JSONB NOT NULL,
  nfc_tag_id      VARCHAR(128),
  evidence_ids    JSONB NOT NULL DEFAULT '[]',
  metadata        JSONB NOT NULL DEFAULT '{}',
  proof_hash      VARCHAR(128) NOT NULL
);

-- =============================================================================
-- Operations: TapKit — NFC Credentials
-- =============================================================================

CREATE TABLE nfc_credentials (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  tag_id            VARCHAR(128) NOT NULL,
  bound_asset_id    VARCHAR(255),
  bound_did         VARCHAR(255),
  status            VARCHAR(20) NOT NULL,
  credential_type   VARCHAR(50) NOT NULL,
  issuer_did        VARCHAR(255) NOT NULL,
  signature         VARCHAR(128) NOT NULL
);

-- =============================================================================
-- Operations: TapKit — Queue Items
-- =============================================================================

CREATE TABLE queue_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  operation_type  VARCHAR(50) NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(20) NOT NULL,
  synced_at       TIMESTAMPTZ,
  retry_count     INT NOT NULL DEFAULT 0,
  error           TEXT
);

-- =============================================================================
-- Operations: TradeCV
-- =============================================================================

CREATE TABLE trade_cvs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  tradepass_id      VARCHAR(255) NOT NULL UNIQUE,
  profile           JSONB NOT NULL,
  summary           JSONB NOT NULL,
  derived_metrics   JSONB NOT NULL,
  attestation_ids   JSONB NOT NULL DEFAULT '[]',
  merkle_root       VARCHAR(128) NOT NULL
);

-- =============================================================================
-- Operations: VaultKit — Custody Records
-- =============================================================================

CREATE TABLE custody_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  asset_id          VARCHAR(255) NOT NULL,
  depositor_did     VARCHAR(255) NOT NULL,
  custodian_did     VARCHAR(255) NOT NULL,
  status            VARCHAR(30) NOT NULL,
  seal_id           VARCHAR(128),
  commodity_type    VARCHAR(50) NOT NULL,
  quantity_value    DECIMAL(12,4) NOT NULL,
  quantity_unit     VARCHAR(10) NOT NULL,
  assay_purity      DECIMAL(5,4) NOT NULL,
  vault_location_id VARCHAR(100) NOT NULL,
  storage_slot      VARCHAR(50),
  released_at       TIMESTAMPTZ,
  proof_hash        VARCHAR(128) NOT NULL
);

-- =============================================================================
-- Operations: VaultKit — Transfer Intents
-- =============================================================================

CREATE TABLE transfer_intents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  custody_record_id   VARCHAR(255) NOT NULL,
  from_custodian_did  VARCHAR(255) NOT NULL,
  to_custodian_did    VARCHAR(255) NOT NULL,
  from_signature      VARCHAR(128),
  to_signature        VARCHAR(128),
  status              VARCHAR(20) NOT NULL,
  completed_at        TIMESTAMPTZ,

  CONSTRAINT transfer_intents_status_check CHECK (
    status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')
  )
);

-- =============================================================================
-- Operations: VaultKit — Vault Audit Entries
-- =============================================================================

CREATE TABLE vault_audit_entries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  custody_record_id   VARCHAR(255) NOT NULL,
  action              VARCHAR(30) NOT NULL,
  actor_did           VARCHAR(255) NOT NULL,
  details             JSONB NOT NULL DEFAULT '{}',
  proof_hash          VARCHAR(128) NOT NULL
);

-- =============================================================================
-- Operations: WorkProof — Attestations
-- =============================================================================

CREATE TABLE workproof_attestations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,

  proof_type        VARCHAR(64) NOT NULL,
  holder_id         VARCHAR(255) NOT NULL,
  issuer_id         VARCHAR(255) NOT NULL,
  issuer_role       VARCHAR(100) NOT NULL,
  claims            JSONB NOT NULL,
  commodity_context VARCHAR(100),
  site_id           VARCHAR(100),
  proof_hash        VARCHAR(128) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  attestation_data  JSONB NOT NULL DEFAULT '{}',

  CONSTRAINT workproof_status_check CHECK (
    status IN ('ACTIVE', 'EXPIRED', 'REVOKED')
  )
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- AGX
CREATE INDEX idx_agx_listings_status ON agx_listings(status);
CREATE INDEX idx_agx_listings_commodity ON agx_listings(commodity_type);
CREATE INDEX idx_agx_buyers_kyc ON agx_buyers(kyc_status);
CREATE INDEX idx_agx_trades_status ON agx_trades(status);
CREATE INDEX idx_agx_trades_seller ON agx_trades(seller_id);

-- CRX
CREATE INDEX idx_crx_apps_applicant ON crx_permit_applications(applicant_did);
CREATE INDEX idx_crx_apps_jurisdiction ON crx_permit_applications(jurisdiction_code);
CREATE INDEX idx_crx_apps_status ON crx_permit_applications(status);
CREATE INDEX idx_crx_permits_holder ON crx_permits(holder_did);
CREATE INDEX idx_crx_permits_jurisdiction ON crx_permits(jurisdiction_code);
CREATE INDEX idx_crx_permits_status ON crx_permits(status);
CREATE INDEX idx_crx_alerts_reference ON crx_compliance_alerts(reference_id);
CREATE INDEX idx_crx_alerts_severity ON crx_compliance_alerts(severity);
CREATE INDEX idx_crx_alerts_workflow ON crx_compliance_alerts(workflow_status);

-- SGX
CREATE INDEX idx_sgx_quotas_producer ON sgx_export_quotas(producer_id);
CREATE INDEX idx_sgx_apps_producer ON sgx_export_applications(producer_id);
CREATE INDEX idx_sgx_apps_status ON sgx_export_applications(status);
CREATE INDEX idx_sgx_apps_clearance_authority ON sgx_export_applications(clearance_authority_id) WHERE clearance_authority_id IS NOT NULL;
CREATE INDEX idx_sgx_apps_status_gci ON sgx_export_applications(status, gci_score_at_submission) WHERE status = 'PENDING_REVIEW';
CREATE INDEX idx_sgx_clearances_producer ON sgx_export_clearances(producer_id);

-- Pathways
CREATE INDEX idx_pathways_profiles_did ON pathways_producer_profiles(producer_did);
CREATE INDEX idx_pathways_transitions_profile ON pathways_stage_transitions(producer_profile_id);
CREATE INDEX idx_pathways_milestones_profile ON pathways_milestones(producer_profile_id);
CREATE INDEX idx_pathways_enrollments_profile ON pathways_training_enrollments(producer_profile_id);
CREATE INDEX idx_pathways_credentials_did ON pathways_career_credentials(producer_did);
CREATE INDEX idx_pathways_financing_profile ON pathways_financing_records(producer_profile_id);

-- Veritas
CREATE INDEX idx_veritas_attestations_subject ON veritas_attestations(subject_id);
CREATE INDEX idx_veritas_attestations_status ON veritas_attestations(status);
CREATE INDEX idx_veritas_events_source ON veritas_protocol_events(source_protocol, source_id);
CREATE INDEX idx_veritas_events_processed ON veritas_protocol_events(processed);
CREATE INDEX idx_veritas_resolutions_status ON veritas_resolutions(status);
CREATE INDEX idx_veritas_api_keys_owner ON veritas_api_keys(owner_did);
CREATE INDEX idx_veritas_usage_api_key ON veritas_usage_records(api_key_id);
CREATE INDEX idx_veritas_webhooks_owner ON veritas_webhooks(owner_did);

-- Shared / Operations
CREATE INDEX idx_gci_operator ON gci_computations(operator_did);
CREATE INDEX idx_gci_jurisdiction ON gci_computations(jurisdiction_code);
CREATE INDEX idx_caas_permit ON caas_ledger(permit_id);
CREATE INDEX idx_caas_operator ON caas_ledger(operator_did);
CREATE INDEX idx_trace_points_asset ON trace_points(asset_id);
CREATE INDEX idx_trace_points_operator ON trace_points(operator_did);
CREATE INDEX idx_nfc_credentials_tag ON nfc_credentials(tag_id);
CREATE INDEX idx_queue_items_status ON queue_items(status);
CREATE INDEX idx_trade_cvs_tradepass ON trade_cvs(tradepass_id);
CREATE INDEX idx_custody_records_asset ON custody_records(asset_id);
CREATE INDEX idx_custody_records_depositor ON custody_records(depositor_did);
CREATE INDEX idx_transfer_intents_custody ON transfer_intents(custody_record_id);
CREATE INDEX idx_vault_audit_custody ON vault_audit_entries(custody_record_id);
CREATE INDEX idx_workproof_holder ON workproof_attestations(holder_id);
CREATE INDEX idx_workproof_issuer ON workproof_attestations(issuer_id);

-- Soft delete filter (partial indexes for active records)
CREATE INDEX idx_agx_listings_active ON agx_listings(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_agx_trades_active ON agx_trades(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crx_permits_active ON crx_permits(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sgx_clearances_active ON sgx_export_clearances(id) WHERE deleted_at IS NULL;

-- =============================================================================
-- S1-02 REMEDIATION: Critical missing tables (added 2026-06-05)
-- =============================================================================
-- These tables were missing from the canonical schema but exist in TypeORM
-- entities. Staging required manual K8s Jobs to create them (XR-302b, etc.).
-- Source: gtcx-platforms/platforms/shared/src/**/*.entity.ts
-- =============================================================================

-- ------------------------------------------------------------------------------
-- SHARED: TradePass Identities
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/operations/tradepass/tradepass-identity.entity.ts
-- Note: Uses `did` as string PK (not UUID). No soft delete.

CREATE TABLE tradepass_identities (
  did                       VARCHAR(256) PRIMARY KEY,
  trade_pass_id             VARCHAR(64) NOT NULL,
  name                      VARCHAR(256) NOT NULL,
  role                      VARCHAR(64) NOT NULL,
  jurisdiction              VARCHAR(8) NOT NULL,
  public_key                VARCHAR(128) NOT NULL,
  status                    VARCHAR(32) NOT NULL DEFAULT 'pending',
  identity_json             JSONB NOT NULL DEFAULT '{}',
  kyc_document_type         VARCHAR(64),
  kyc_document_ref          VARCHAR(512),
  kyc_document_status       VARCHAR(16) DEFAULT NULL,
  kyc_verified_at           TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tradepass_identities_tradepass ON tradepass_identities(trade_pass_id);
CREATE INDEX idx_tradepass_identities_jurisdiction ON tradepass_identities(jurisdiction);
CREATE INDEX idx_tradepass_identities_status ON tradepass_identities(status);

-- ------------------------------------------------------------------------------
-- SHARED: Audit Records
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/audit/audit-record.entity.ts
-- Extends BaseEntity: id (UUID PK), created_at, updated_at, deleted_at

CREATE TABLE audit_records (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ,

  request_id                UUID NOT NULL,
  actor_did                 VARCHAR(255) NOT NULL,
  action                    VARCHAR(512) NOT NULL,
  resource_id               VARCHAR(255),
  timestamp                 TIMESTAMPTZ NOT NULL,
  outcome                   VARCHAR(20) NOT NULL,
  status_code               INT NOT NULL,
  entity_type               VARCHAR(50),
  jurisdiction_code         VARCHAR(10),
  processing_time_ms        INT,
  request_body_hash         VARCHAR(64),
  metadata                  JSONB
);

CREATE INDEX idx_audit_records_request_id ON audit_records(request_id);
CREATE INDEX idx_audit_records_actor ON audit_records(actor_did);
CREATE INDEX idx_audit_records_action ON audit_records(action);
CREATE INDEX idx_audit_records_timestamp ON audit_records(timestamp);
CREATE INDEX idx_audit_records_outcome ON audit_records(outcome);

-- ------------------------------------------------------------------------------
-- SHARED: Outbox (event publishing)
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/events/outbox.entity.ts
-- Note: No soft delete. publishedAt is nullable.

CREATE TABLE outbox (
  id                        UUID PRIMARY KEY,
  event_type                VARCHAR NOT NULL,
  payload                   JSONB NOT NULL,
  aggregate_type            VARCHAR NOT NULL,
  aggregate_id              VARCHAR NOT NULL,
  published                 BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at              TIMESTAMPTZ
);

CREATE INDEX idx_outbox_unpublished ON outbox(created_at) WHERE published = FALSE;
CREATE INDEX idx_outbox_aggregate ON outbox(aggregate_type, aggregate_id);
CREATE INDEX idx_outbox_event_type ON outbox(event_type);

-- ------------------------------------------------------------------------------
-- SHARED: Idempotency Keys
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/resilience/idempotency-key.entity.ts
-- Composite PK: (key, actor_did, route)

CREATE TABLE idempotency_keys (
  key                       VARCHAR(128) NOT NULL,
  actor_did                 VARCHAR(255) NOT NULL,
  route                     VARCHAR(512) NOT NULL,
  request_hash              VARCHAR(64) NOT NULL,
  status_code               INT NOT NULL,
  response_body             JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at                TIMESTAMPTZ NOT NULL,

  PRIMARY KEY (key, actor_did, route)
);

CREATE INDEX idx_idempotency_keys_expires ON idempotency_keys(expires_at);
CREATE INDEX idx_idempotency_keys_actor ON idempotency_keys(actor_did);

-- =============================================================================
-- S1-02 REMEDIATION: Phase 2 — Remaining platform parity tables (2026-06-05)
-- =============================================================================
-- These tables were missing from the canonical schema but exist in TypeORM
-- entities across platforms/shared, platforms/sovereign, platforms/veritas,
-- platforms/tradepass, and platforms/operations.
-- Source: gtcx-platforms/platforms/*/src/**/*.entity.ts
-- =============================================================================

-- ------------------------------------------------------------------------------
-- SHARED: Compliance Rules
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/compliance/compliance-rule.entity.ts

CREATE TABLE compliance_rules (
  id                          VARCHAR PRIMARY KEY,
  jurisdiction_code           VARCHAR NOT NULL,
  subject                     VARCHAR NOT NULL,
  name                        VARCHAR NOT NULL,
  condition                   TEXT NOT NULL,
  severity                    VARCHAR NOT NULL,
  message                     VARCHAR NOT NULL,
  remediation_steps           JSONB,
  active                      BOOLEAN NOT NULL DEFAULT TRUE,
  version                     INT NOT NULL DEFAULT 1,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_rules_jurisdiction ON compliance_rules(jurisdiction_code);
CREATE INDEX idx_compliance_rules_subject ON compliance_rules(subject);
CREATE INDEX idx_compliance_rules_active ON compliance_rules(active);

-- ------------------------------------------------------------------------------
-- SHARED: Device Keys
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/crypto/device-key.entity.ts

CREATE TABLE device_keys (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  did                         VARCHAR(128) NOT NULL,
  device_id                   VARCHAR(64) NOT NULL,
  key_type                    VARCHAR(32) NOT NULL,
  public_key                  TEXT NOT NULL,
  key_fingerprint             VARCHAR(64) NOT NULL,
  status                      VARCHAR(20) NOT NULL,
  expires_at                  TIMESTAMPTZ,
  rotated_at                  TIMESTAMPTZ,
  rotated_by                  VARCHAR(128),
  revoked_by                  VARCHAR(128),
  revocation_reason           TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_device_keys_did_device ON device_keys(did, device_id);
CREATE INDEX idx_device_keys_did_status ON device_keys(did, status);
CREATE INDEX idx_device_keys_status ON device_keys(status);

-- ------------------------------------------------------------------------------
-- SHARED: Webhook Subscriptions
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/marketplace/webhook-subscription.entity.ts

CREATE TABLE webhook_subscriptions (
  id                          UUID PRIMARY KEY,
  subscriber_did              VARCHAR NOT NULL,
  endpoint                    VARCHAR NOT NULL,
  event_types                 TEXT NOT NULL,
  secret                      VARCHAR NOT NULL,
  status                      VARCHAR NOT NULL,
  delivery_count              INT NOT NULL DEFAULT 0,
  failure_count               INT NOT NULL DEFAULT 0,
  last_delivered_at           TIMESTAMPTZ,
  last_failure_at             TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_subscriptions_subscriber ON webhook_subscriptions(subscriber_did);
CREATE INDEX idx_webhook_subscriptions_status ON webhook_subscriptions(status);

-- ------------------------------------------------------------------------------
-- SHARED: GeoTag Sites
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/operations/geotag/geotag-site.entity.ts

CREATE TABLE geotag_sites (
  id                          VARCHAR(128) PRIMARY KEY,
  name                        VARCHAR(256) NOT NULL,
  site_type                   VARCHAR(64) NOT NULL,
  geofence                    JSONB NOT NULL,
  jurisdiction                VARCHAR(8) NOT NULL,
  operator_did                VARCHAR(256) NOT NULL,
  commodity_types             JSONB,
  estimated_monthly_capacity_kg DECIMAL(12,3),
  allowed_grades              JSONB,
  min_assay_purity            DECIMAL(5,4),
  status                      VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geotag_sites_jurisdiction ON geotag_sites(jurisdiction);
CREATE INDEX idx_geotag_sites_operator ON geotag_sites(operator_did);
CREATE INDEX idx_geotag_sites_status ON geotag_sites(status);

-- ------------------------------------------------------------------------------
-- SHARED: GeoTag Proofs
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/operations/geotag/geotag.entity.ts
-- Note: Table name is geotag_proofs (entity is GeoTagProofEntity).

CREATE TABLE geotag_proofs (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  proof_id                    VARCHAR NOT NULL,
  operator_did                VARCHAR NOT NULL,
  latitude                    DOUBLE PRECISION NOT NULL,
  longitude                   DOUBLE PRECISION NOT NULL,
  altitude                    DOUBLE PRECISION,
  accuracy                    DOUBLE PRECISION,
  timestamp                   VARCHAR NOT NULL,
  signature                   TEXT NOT NULL,
  verification_status         VARCHAR NOT NULL DEFAULT 'pending',
  anti_spoof_passed           BOOLEAN NOT NULL DEFAULT FALSE,
  site_id                     VARCHAR,
  commodity                   VARCHAR
);

CREATE INDEX idx_geotag_proofs_operator ON geotag_proofs(operator_did);
CREATE INDEX idx_geotag_proofs_proof_id ON geotag_proofs(proof_id);
CREATE INDEX idx_geotag_proofs_status ON geotag_proofs(verification_status);

-- ------------------------------------------------------------------------------
-- SHARED: TradePass Credentials
-- ------------------------------------------------------------------------------
-- Entity: platforms/shared/src/operations/tradepass/tradepass.entity.ts

CREATE TABLE tradepass_credentials (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  credential_json             JSONB NOT NULL,
  issuer_did                  VARCHAR(255) NOT NULL,
  subject_did                 VARCHAR(255) NOT NULL,
  credential_type             VARCHAR(50) NOT NULL,
  status                      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  issued_at                   TIMESTAMPTZ NOT NULL,
  expires_at                  TIMESTAMPTZ,
  revoked_at                  TIMESTAMPTZ,
  revocation_reason           TEXT
);

CREATE INDEX idx_tradepass_credentials_issuer ON tradepass_credentials(issuer_did);
CREATE INDEX idx_tradepass_credentials_subject ON tradepass_credentials(subject_did);
CREATE INDEX idx_tradepass_credentials_status ON tradepass_credentials(status);

-- ------------------------------------------------------------------------------
-- SOVEREIGN: SGX Custody Events
-- ------------------------------------------------------------------------------
-- Entity: platforms/sovereign/src/entities/sgx/custody-event.entity.ts

CREATE TABLE sgx_custody_events (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  event_id                    VARCHAR NOT NULL UNIQUE,
  export_application_number   VARCHAR NOT NULL,
  event_type                  VARCHAR NOT NULL,
  asset_id                    VARCHAR NOT NULL,
  custodian_did               VARCHAR NOT NULL,
  from_custodian_did          VARCHAR,
  to_custodian_did            VARCHAR,
  seal_id                     TEXT,
  vault_location              TEXT,
  custody_proof_hash          TEXT,
  previous_custody_proof_hash TEXT,
  chain_of_custody            JSONB,
  status                      VARCHAR NOT NULL DEFAULT 'PENDING',
  rejection_reason            TEXT,
  recorded_at                 TIMESTAMPTZ NOT NULL,
  validated_at                TIMESTAMPTZ
);

CREATE INDEX idx_sgx_custody_events_event_id ON sgx_custody_events(event_id);
CREATE INDEX idx_sgx_custody_events_export_app ON sgx_custody_events(export_application_number);
CREATE INDEX idx_sgx_custody_events_custodian ON sgx_custody_events(custodian_did);
CREATE INDEX idx_sgx_custody_events_status ON sgx_custody_events(status);

-- ------------------------------------------------------------------------------
-- SOVEREIGN: SGX Revenue Collections
-- ------------------------------------------------------------------------------
-- Entity: platforms/sovereign/src/entities/sgx/revenue-collection.entity.ts

CREATE TABLE sgx_revenue_collections (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  collection_number           VARCHAR NOT NULL UNIQUE,
  clearance_id                VARCHAR NOT NULL,
  producer_id                 VARCHAR NOT NULL,
  commodity_type              VARCHAR NOT NULL,
  total_tax_cents             BIGINT NOT NULL,
  currency                    VARCHAR NOT NULL DEFAULT 'USD',
  status                      VARCHAR NOT NULL,
  collected_at                TIMESTAMPTZ NOT NULL,
  paid_at                     TIMESTAMPTZ,
  payment_method              VARCHAR,
  payment_reference           VARCHAR,
  confirmed_by                VARCHAR
);

CREATE INDEX idx_sgx_revenue_collections_clearance ON sgx_revenue_collections(clearance_id);
CREATE INDEX idx_sgx_revenue_collections_producer ON sgx_revenue_collections(producer_id);
CREATE INDEX idx_sgx_revenue_collections_status ON sgx_revenue_collections(status);

-- ------------------------------------------------------------------------------
-- SOVEREIGN: CRX Inspection Evidence
-- ------------------------------------------------------------------------------
-- Entity: platforms/sovereign/src/entities/crx/inspection-evidence.entity.ts

CREATE TABLE crx_inspection_evidence (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  evidence_id                 VARCHAR NOT NULL UNIQUE,
  application_number          VARCHAR NOT NULL,
  evidence_type               VARCHAR NOT NULL,
  operator_did                VARCHAR NOT NULL,
  description                 TEXT,
  image_hash                  TEXT,
  latitude                    DECIMAL(10,4),
  longitude                   DECIMAL(10,4),
  accuracy_meters             DECIMAL(10,4),
  geotag_proof_id             TEXT,
  attestation_id              TEXT,
  attestation_proof_hash      TEXT,
  extracted_fields            JSONB,
  status                      VARCHAR NOT NULL DEFAULT 'PENDING',
  rejection_reason            TEXT,
  captured_at                 TIMESTAMPTZ NOT NULL,
  reviewed_at                 TIMESTAMPTZ,
  submitted_at                TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_crx_inspection_evidence_app ON crx_inspection_evidence(application_number);
CREATE INDEX idx_crx_inspection_evidence_operator ON crx_inspection_evidence(operator_did);
CREATE INDEX idx_crx_inspection_evidence_status ON crx_inspection_evidence(status);

-- ------------------------------------------------------------------------------
-- SOVEREIGN: CRX Permit Documents
-- ------------------------------------------------------------------------------
-- Entity: platforms/sovereign/src/entities/crx/permit-document.entity.ts

CREATE TABLE crx_permit_documents (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  application_id              VARCHAR NOT NULL,
  document_type               VARCHAR NOT NULL,
  file_name                   VARCHAR NOT NULL,
  storage_key                 VARCHAR NOT NULL,
  file_hash                   VARCHAR(64) NOT NULL,
  file_size                   INT NOT NULL,
  status                      VARCHAR NOT NULL DEFAULT 'PENDING',
  verified_by                 VARCHAR,
  verified_at                 TIMESTAMPTZ,
  rejection_reason            TEXT,
  uploaded_at                 TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_crx_permit_documents_application ON crx_permit_documents(application_id);
CREATE INDEX idx_crx_permit_documents_status ON crx_permit_documents(status);

-- ------------------------------------------------------------------------------
-- SOVEREIGN: Pathways Evidence
-- ------------------------------------------------------------------------------
-- Entity: platforms/sovereign/src/entities/pathways/evidence.entity.ts

CREATE TABLE pathways_evidence (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  milestone_id                VARCHAR NOT NULL,
  evidence_type               VARCHAR NOT NULL,
  file_url                    VARCHAR NOT NULL,
  mime_type                   VARCHAR,
  file_size                   INT,
  uploaded_by                 VARCHAR NOT NULL,
  uploaded_at                 TIMESTAMPTZ NOT NULL,
  metadata                    JSONB
);

CREATE INDEX idx_pathways_evidence_milestone ON pathways_evidence(milestone_id);
CREATE INDEX idx_pathways_evidence_uploaded_by ON pathways_evidence(uploaded_by);

-- ------------------------------------------------------------------------------
-- VERITAS: Claims
-- ------------------------------------------------------------------------------
-- Entity: platforms/veritas/src/entities/claim.entity.ts

CREATE TABLE veritas_claims (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  claim_id                    VARCHAR NOT NULL UNIQUE,
  claim_type                  VARCHAR NOT NULL,
  subject_type                VARCHAR NOT NULL,
  subject_id                  VARCHAR NOT NULL,
  assertions                  TEXT NOT NULL,
  metadata                    JSONB,
  status                      VARCHAR NOT NULL,
  confidence                  DOUBLE PRECISION NOT NULL,
  proof_hash                  TEXT,
  evaluated_at                VARCHAR NOT NULL
);

CREATE INDEX idx_veritas_claims_claim_id ON veritas_claims(claim_id);
CREATE INDEX idx_veritas_claims_subject ON veritas_claims(subject_type, subject_id);
CREATE INDEX idx_veritas_claims_status ON veritas_claims(status);

-- ------------------------------------------------------------------------------
-- VERITAS: Confidence Provenance
-- ------------------------------------------------------------------------------
-- Entity: platforms/veritas/src/entities/confidence-provenance.entity.ts

CREATE TABLE veritas_confidence_provenance (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  target_type                 VARCHAR NOT NULL,
  target_id                   VARCHAR NOT NULL,
  overall_confidence          DECIMAL(5,4) NOT NULL,
  methodology_version         VARCHAR NOT NULL,
  sources                     JSONB NOT NULL,
  computation_summary         TEXT,
  data_hash                   VARCHAR,
  computed_by                 VARCHAR NOT NULL,
  computation_duration_ms     INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_veritas_conf_prov_target ON veritas_confidence_provenance(target_type, target_id);
CREATE INDEX idx_veritas_conf_prov_computed_by ON veritas_confidence_provenance(computed_by);

-- ------------------------------------------------------------------------------
-- VERITAS: Data Stream Subscriptions
-- ------------------------------------------------------------------------------
-- Entity: platforms/veritas/src/entities/data-stream-subscription.entity.ts

CREATE TABLE veritas_data_stream_subscriptions (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  subscription_number         VARCHAR NOT NULL UNIQUE,
  subscriber_did              VARCHAR NOT NULL,
  stream_type                 VARCHAR NOT NULL,
  filters                     TEXT NOT NULL,
  status                      VARCHAR NOT NULL DEFAULT 'active',
  started_at                  TIMESTAMPTZ NOT NULL,
  expires_at                  TIMESTAMPTZ,
  last_delivered_at           TIMESTAMPTZ,
  events_delivered            BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_veritas_data_streams_subscriber ON veritas_data_stream_subscriptions(subscriber_did);
CREATE INDEX idx_veritas_data_streams_status ON veritas_data_stream_subscriptions(status);

-- ------------------------------------------------------------------------------
-- VERITAS: Inspections
-- ------------------------------------------------------------------------------
-- Entity: platforms/veritas/src/entities/inspection.entity.ts

CREATE TABLE veritas_inspections (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  inspection_id               VARCHAR NOT NULL UNIQUE,
  facility_name               VARCHAR NOT NULL,
  commodity                   VARCHAR NOT NULL,
  country                     VARCHAR NOT NULL,
  inspector_did               VARCHAR NOT NULL,
  client_did                  VARCHAR NOT NULL,
  phases                      JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_veritas_inspections_inspection_id ON veritas_inspections(inspection_id);
CREATE INDEX idx_veritas_inspections_inspector ON veritas_inspections(inspector_did);
CREATE INDEX idx_veritas_inspections_client ON veritas_inspections(client_did);

-- ------------------------------------------------------------------------------
-- VERITAS: Screening Decisions
-- ------------------------------------------------------------------------------
-- Entity: platforms/veritas/src/entities/screening-decision.entity.ts

CREATE TABLE veritas_screening_decisions (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  subject_id                  VARCHAR NOT NULL,
  subject_type                VARCHAR NOT NULL,
  decision_id                 VARCHAR,
  risk_level                  VARCHAR NOT NULL,
  approved                    BOOLEAN NOT NULL,
  conditions                  TEXT,
  risk_score                  DECIMAL(5,2) NOT NULL DEFAULT 0,
  screened_at                 TIMESTAMPTZ NOT NULL,
  attestation_id              VARCHAR
);

CREATE INDEX idx_veritas_screening_subject ON veritas_screening_decisions(subject_type, subject_id);
CREATE INDEX idx_veritas_screening_risk ON veritas_screening_decisions(risk_level);
CREATE INDEX idx_veritas_screening_attestation ON veritas_screening_decisions(attestation_id);

-- ------------------------------------------------------------------------------
-- TRADEPASS: Roster Assignments
-- ------------------------------------------------------------------------------
-- Entity: platforms/tradepass/src/roster/roster-assignment.entity.ts

CREATE TABLE roster_assignments (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  cooperative_id              VARCHAR NOT NULL,
  did                         VARCHAR NOT NULL
);

CREATE UNIQUE INDEX idx_roster_assignments_unique ON roster_assignments(cooperative_id, did);
CREATE INDEX idx_roster_assignments_did ON roster_assignments(did);

-- ------------------------------------------------------------------------------
-- TRADEPASS: Market Prices
-- ------------------------------------------------------------------------------
-- Entity: platforms/tradepass/src/market/market-price.entity.ts

CREATE TABLE market_prices (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  commodity                   VARCHAR NOT NULL,
  price                       DOUBLE PRECISION NOT NULL,
  unit                        VARCHAR NOT NULL,
  currency                    VARCHAR NOT NULL,
  jurisdiction                VARCHAR NOT NULL,
  history                     JSONB NOT NULL DEFAULT '[]'
);

CREATE UNIQUE INDEX idx_market_prices_commodity_jurisdiction ON market_prices(commodity, jurisdiction);
CREATE INDEX idx_market_prices_jurisdiction ON market_prices(jurisdiction);

-- ------------------------------------------------------------------------------
-- TRADEPASS: Sync Counters
-- ------------------------------------------------------------------------------
-- Entity: platforms/tradepass/src/sync/sync-counter.entity.ts

CREATE TABLE sync_counters (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  counter_key                 VARCHAR NOT NULL UNIQUE,
  value                       INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_sync_counters_key ON sync_counters(counter_key);

-- ------------------------------------------------------------------------------
-- TRADEPASS: Sync Items
-- ------------------------------------------------------------------------------
-- Entity: platforms/tradepass/src/sync/sync-item.entity.ts

CREATE TABLE sync_items (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  sync_id                     VARCHAR NOT NULL,
  type                        VARCHAR NOT NULL,
  method                      VARCHAR NOT NULL,
  url                         VARCHAR NOT NULL,
  body                        JSONB NOT NULL,
  processed_at                VARCHAR,
  status                      VARCHAR NOT NULL DEFAULT 'pending',
  error                       TEXT,
  operator_did                VARCHAR NOT NULL
);

CREATE INDEX idx_sync_items_operator ON sync_items(operator_did);
CREATE INDEX idx_sync_items_status ON sync_items(status);
CREATE INDEX idx_sync_items_sync_id ON sync_items(sync_id);

-- ------------------------------------------------------------------------------
-- OPERATIONS: Checklists
-- ------------------------------------------------------------------------------
-- Entity: platforms/operations/checklist/src/entities/checklist.entity.ts
-- Note: submitted_at and reviewed_at use VARCHAR in the entity definition
-- (TypeORM decorator type: 'varchar'); stored as ISO-8601 strings.

CREATE TABLE ops_checklists (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                  TIMESTAMPTZ,

  tenant_id                   VARCHAR(2) NOT NULL,
  inspector_did               VARCHAR NOT NULL,
  site_id                     VARCHAR NOT NULL,
  inspection_type             VARCHAR,
  payload                     JSONB NOT NULL,
  status                      VARCHAR NOT NULL DEFAULT 'draft',
  submitted_at                VARCHAR,
  reviewed_at                 VARCHAR,
  reviewer_did                VARCHAR,
  review_notes                TEXT
);

CREATE INDEX idx_ops_checklists_tenant_status ON ops_checklists(tenant_id, status, updated_at);
CREATE INDEX idx_ops_checklists_inspector_status ON ops_checklists(inspector_did, status);
CREATE INDEX idx_ops_checklists_site ON ops_checklists(site_id);
