/**
 * Replay Protection Type Declarations
 */

export interface QueueIntegrity {
  scheme: string;
  did: string;
  keyId: string;
  audience: string;
  bodyHash: string;
  headersHash: string;
  timestamp: string;
  nonce: string;
  signature: string;
  envelopeHash: string;
}

export interface VerifyContext {
  remoteAddress?: string;
  userAgent?: string;
  region?: string;
  requestId?: string;
  deviceId?: string;
}

export interface VerifyResult {
  allowed: boolean;
  reason?: string;
  code?: string;
  auditEvent?: AuditEvent;
}

export interface AuditEvent {
  eventId: string;
  timestampMs: number;
  eventType: string;
  nonce?: string;
  did?: string;
  reason?: string;
  code?: string;
  region?: string;
  requestId?: string;
  deviceId?: string;
  clockSkewMs?: number;
  acceptanceWindowMs?: number;
  isDelayedOfflineReplay?: boolean;
}

export interface ClockSkewPolicy {
  windowMs: number;
  lowConnectivityBufferMs: number;
  maxFutureMs: number;
  readonly lowConnectivityRegions: readonly string[];
}

export interface AuthFailureLogEntry {
  level: string;
  timestamp: string;
  type: string;
  nonce?: string;
  did?: string;
  reason?: string;
  code?: string;
  remoteAddress?: string;
  userAgent?: string;
  requestId?: string;
  region?: string;
}

export interface ReplayMetricsSnapshot {
  acceptedTotal: number;
  rejectedNonceTotal: number;
  rejectedStaleTotal: number;
  rejectedFutureTotal: number;
  rejectedSignatureTotal: number;
  rejectedEnvelopeTotal: number;
}
