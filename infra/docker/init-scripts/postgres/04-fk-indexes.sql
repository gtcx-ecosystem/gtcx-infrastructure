-- =============================================================================
-- Sprint 66: Add missing FK indexes for query performance
-- =============================================================================
-- These foreign key columns were missing indexes, causing sequential scans
-- on JOIN and WHERE clauses referencing parent tables.
-- =============================================================================

-- agx_trades: buyer lookups and listing joins
CREATE INDEX IF NOT EXISTS idx_agx_trades_buyer_id ON agx_trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_agx_trades_listing_id ON agx_trades(listing_id);

-- crx_permits: permit-to-application joins
CREATE INDEX IF NOT EXISTS idx_crx_permits_application_id ON crx_permits(application_id);

-- pathways_career_credentials: credential-to-profile joins
CREATE INDEX IF NOT EXISTS idx_pathways_career_credentials_profile ON pathways_career_credentials(producer_profile_id);

-- pathways_training_enrollments: enrollment-to-program joins
CREATE INDEX IF NOT EXISTS idx_pathways_training_enrollments_program ON pathways_training_enrollments(training_program_id);

-- sgx_export_clearances: clearance-to-application joins
CREATE INDEX IF NOT EXISTS idx_sgx_export_clearances_application ON sgx_export_clearances(application_id);
