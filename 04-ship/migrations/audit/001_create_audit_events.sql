-- =============================================================================
-- GTCX Audit Events Schema — Replay Protection
-- =============================================================================
-- Append-only table for replay-protection audit events.
-- Never UPDATE. Never DELETE. 7-year retention via S3 Glacier export.
--
-- Principles: AUDITABLE (P3), SECURE (P11)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS gtcx_audit;

CREATE TABLE IF NOT EXISTS gtcx_audit.replay_events (
    event_id        UUID PRIMARY KEY,
    timestamp_ms    BIGINT NOT NULL,
    event_type      TEXT NOT NULL CHECK (event_type IN ('replay.accepted', 'replay.rejected')),
    nonce           TEXT,
    did             TEXT,
    reason          TEXT,
    code            TEXT,
    region          TEXT,
    request_id      TEXT,
    device_id       TEXT,
    clock_skew_ms   BIGINT,
    acceptance_window_ms BIGINT,
    is_delayed_offline_replay BOOLEAN,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query patterns used by monitoring and compliance exports
CREATE INDEX IF NOT EXISTS idx_replay_events_timestamp
    ON gtcx_audit.replay_events (timestamp_ms DESC);

CREATE INDEX IF NOT EXISTS idx_replay_events_nonce
    ON gtcx_audit.replay_events (nonce);

CREATE INDEX IF NOT EXISTS idx_replay_events_did
    ON gtcx_audit.replay_events (did);

CREATE INDEX IF NOT EXISTS idx_replay_events_code
    ON gtcx_audit.replay_events (code, timestamp_ms DESC);

-- Partitioning ready: when volume grows, partition by range on created_at
-- ALTER TABLE gtcx_audit.replay_events ADD CONSTRAINT ... PARTITION BY RANGE (created_at);
