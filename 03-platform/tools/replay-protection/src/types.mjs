/**
 * @fileoverview Replay Protection Types
 *
 * Mirrors the QueueIntegrity contract from gtcx-mobile's offline queue.
 * All backend verifiers must consume this shape.
 *
 * Principles: SECURE (P11), AUDITABLE (P3)
 */

/**
 * @typedef {object} QueueIntegrity
 * @property {string} scheme - Signature scheme (e.g. "did-jwt-es256")
 * @property {string} did - Issuer DID
 * @property {string} keyId - Key identifier used for signing
 * @property {string} audience - Intended audience (aud claim)
 * @property {string} bodyHash - SHA-256 of canonical body JSON
 * @property {string} headersHash - SHA-256 of canonical headers
 * @property {string} timestamp - ISO-8601 timestamp when queued
 * @property {string} nonce - Cryptographically random nonce (≥16 bytes hex)
 * @property {string} signature - Base64-encoded signature over envelopeHash
 * @property {string} envelopeHash - SHA-256 of canonical request envelope
 */

/**
 * @typedef {object} VerifyContext
 * @property {string} [remoteAddress] - Client IP or forwarded IP
 * @property {string} [userAgent] - User-Agent header
 * @property {string} [region] - Deployment region (e.g. "global-south", "us-east")
 * @property {string} [requestId] - Trace / request ID for correlation
 * @property {string} [deviceId] - Mobile device identifier
 */

/**
 * @typedef {object} VerifyResult
 * @property {boolean} allowed - Whether the request passes replay protection
 * @property {string} [reason] - Human-readable rejection reason
 * @property {string} [code] - Machine-readable rejection code:
 *   - "REPLAY_NONCE" — nonce already seen
 *   - "REPLAY_STALE" — timestamp outside acceptance window
 *   - "REPLAY_FUTURE" — timestamp is in the future (clock skew)
 *   - "REPLAY_SIGNATURE" — signature verification failed
 *   - "REPLAY_ENVELOPE" — envelope / body / header hash mismatch
 *   - "REPLAY_OK" — accepted
 * @property {AuditEvent} [auditEvent] - Populated for every check, success or failure
 */

/**
 * @typedef {object} AuditEvent
 * @property {string} eventId - UUID v4
 * @property {number} timestampMs - Unix epoch ms
 * @property {string} eventType - "replay.accepted" | "replay.rejected"
 * @property {string} [nonce] - Nonce under test
 * @property {string} [did] - Issuer DID
 * @property {string} [reason] - Rejection reason
 * @property {string} [code] - Rejection code
 * @property {string} [region] - Region label
 * @property {string} [requestId] - Correlation ID
 * @property {string} [deviceId] - Device ID
 * @property {number} [clockSkewMs] - Detected clock skew in ms
 * @property {number} [acceptanceWindowMs] - Window used for this check
 * @property {boolean} [isDelayedOfflineReplay] - true if skew > 5 min (offline queue backlog)
 */

/**
 * @typedef {object} ClockSkewPolicy
 * @property {number} windowMs - Base acceptance window in milliseconds
 * @property {number} lowConnectivityBufferMs - Extra tolerance for low-connectivity regions
 * @property {number} maxFutureMs - Maximum future-dated timestamp allowed
 * @property {string[]} lowConnectivityRegions - Region labels that get extra buffer
 */

/**
 * @typedef {object} AuthFailureLogEntry
 * @property {string} level - "warn" | "error"
 * @property {string} timestamp - ISO-8601
 * @property {string} type - "auth.replay.rejected"
 * @property {string} [nonce]
 * @property {string} [did]
 * @property {string} [reason]
 * @property {string} [code]
 * @property {string} [remoteAddress]
 * @property {string} [userAgent]
 * @property {string} [requestId]
 * @property {string} [region]
 */

/**
 * @typedef {object} ReplayMetricsSnapshot
 * @property {number} acceptedTotal
 * @property {number} rejectedNonceTotal
 * @property {number} rejectedStaleTotal
 * @property {number} rejectedFutureTotal
 * @property {number} rejectedSignatureTotal
 * @property {number} rejectedEnvelopeTotal
 */

export {};
