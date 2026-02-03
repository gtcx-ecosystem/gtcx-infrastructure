# KORA - Technical Architecture Specification

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Author**: GTCX Trust Engineering Team  
**Status**: In Development  


## 1. System Overview

### Architecture Philosophy
KORA follows a **cryptographically-secure, event-sourced architecture** designed for:
- **Trust**: Every verification is cryptographically provable
- **Resilience**: Byzantine fault tolerance for disputed claims
- **Learning**: ML-driven fraud detection that improves over time
- **Federation**: Cross-border trust without centralization
- **Privacy**: Zero-knowledge proofs for sensitive data

### High-Level Architecture
```
┌────────────────────────────────────────────────────────────┐
│                    KORA VERIFICATION ORACLE                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Input     │  │  Verification │  │     Proof       │  │
│  │  Validator  │→ │    Engine     │→ │   Generator     │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
│         ↑                ↑                    ↓            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │          Multi-Source Verification Layer              │ │
│  │   [Government] [Community] [Satellite] [Field]        │ │
│  └──────────────────────────────────────────────────────┘ │
│                           ↓                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │             Learning & Adaptation Engine              │ │
│  │         (Pattern Recognition & Fraud Detection)       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└────────────────────────────────────────────────────────────┘
```


## 2. Component Architecture

### 2.1 Input Validation Layer

#### Purpose
Validate and normalize incoming verification requests

#### Components
```rust
// Core validation structure
pub struct InputValidator {
    schema_validator: SchemaValidator,
    rate_limiter: RateLimiter,
    dedup_engine: DeduplicationEngine,
    sanitizer: DataSanitizer,
}

impl InputValidator {
    pub async fn validate(&self, request: VerificationRequest) -> Result<ValidatedInput> {
        // Step 1: Schema validation
        self.schema_validator.validate(&request)?;
        
        // Step 2: Rate limiting
        self.rate_limiter.check_limit(&request.requester)?;
        
        // Step 3: Deduplication
        if self.dedup_engine.is_duplicate(&request) {
            return Ok(self.get_cached_result(&request));
        }
        
        // Step 4: Sanitization
        let sanitized = self.sanitizer.clean(&request);
        
        Ok(ValidatedInput::new(sanitized))
    }
}
```

### 2.2 Multi-Source Verification Engine

#### Purpose
Orchestrate verification across multiple authoritative sources

#### Verification Sources
```yaml
verification_sources:
  government_registry:
    weight: 0.40
    timeout: 5s
    retry_count: 3
    fallback: cached_data
    endpoints:
      - primary: "https://registry.gov/api/v1"
      - backup: "https://backup.registry.gov/api/v1"
    
  community_validation:
    weight: 0.25
    min_validators: 3
    max_validators: 7
    consensus_threshold: 0.66
    validator_reputation_required: 0.7
    
  satellite_imagery:
    weight: 0.20
    providers:
      - sentinel_2
      - landsat_8
      - planet_labs
    resolution_required: 10m
    temporal_range: 6_months
    
  field_verification:
    weight: 0.15
    gps_accuracy_required: 5m
    photo_required: true
    biometric_signature: true
    timestamp_tolerance: 1_hour
```

#### Verification Orchestration
```rust
pub struct VerificationOrchestrator {
    sources: Vec<Box<dyn VerificationSource>>,
    ml_engine: FraudDetectionEngine,
    consensus: ConsensusEngine,
}

impl VerificationOrchestrator {
    pub async fn verify(&self, input: ValidatedInput) -> VerificationResult {
        // Parallel verification from all sources
        let futures = self.sources.iter().map(|source| {
            source.verify(input.clone())
        });
        
        let results = futures::future::join_all(futures).await;
        
        // ML fraud analysis
        let fraud_score = self.ml_engine.analyze(&input, &results).await;
        
        // Byzantine fault tolerant consensus
        let consensus = self.consensus.evaluate(
            results,
            self.get_weights(),
            fraud_score
        );
        
        // Generate verification result
        VerificationResult {
            confidence: consensus.confidence,
            sources_confirmed: consensus.confirmed_sources,
            fraud_risk: fraud_score,
            timestamp: Utc::now(),
        }
    }
}
```

### 2.3 Cryptographic Proof System

#### Proof Generation
```rust
use ark_crypto::{merkle_tree, signatures};

pub struct ProofGenerator {
    merkle_builder: MerkleTreeBuilder,
    signer: MultiSigner,
    zk_prover: ZeroKnowledgeProver,
}

impl ProofGenerator {
    pub fn generate_proof(&self, verification: VerificationResult) -> CryptographicProof {
        // Build Merkle tree from verification data
        let tree = self.merkle_builder.build(&verification);
        
        // Generate multi-signature
        let signatures = self.signer.sign_multi(
            &tree.root(),
            &self.get_authorized_signers()
        );
        
        // Optional: Generate zero-knowledge proof
        let zk_proof = if verification.requires_privacy() {
            Some(self.zk_prover.prove_without_revealing(
                &verification.private_data,
                &verification.public_commitment
            ))
        } else {
            None
        };
        
        CryptographicProof {
            merkle_root: tree.root(),
            merkle_path: tree.get_path(&verification.id),
            signatures,
            zk_proof,
            timestamp: verification.timestamp,
            expiry: verification.timestamp + Duration::days(365),
        }
    }
}
```

#### Zero-Knowledge Proof Implementation
```rust
// Prove ownership without revealing owner identity
pub struct ZKOwnershipProof {
    commitment: G1Affine,
    challenge: Fr,
    response: Fr,
}

impl ZeroKnowledgeProver {
    pub fn prove_ownership(
        &self,
        secret: &OwnershipSecret,
        public_input: &ParcelData
    ) -> ZKOwnershipProof {
        // Pedersen commitment to the secret
        let (commitment, randomness) = self.commit(secret);
        
        // Fiat-Shamir challenge
        let challenge = self.hash_to_challenge(&commitment, public_input);
        
        // Schnorr-like response
        let response = randomness + challenge * secret.scalar();
        
        ZKOwnershipProof {
            commitment,
            challenge,
            response,
        }
    }
    
    pub fn verify_proof(
        &self,
        proof: &ZKOwnershipProof,
        public_input: &ParcelData
    ) -> bool {
        // Verify the proof without knowing the secret
        let expected = self.commitment_from_response(
            &proof.response,
            &proof.challenge,
            public_input
        );
        
        expected == proof.commitment
    }
}
```

### 2.4 Fraud Detection Engine

#### ML-Based Pattern Recognition
```python
import tensorflow as tf
from typing import List, Dict
import numpy as np

class FraudDetectionEngine:
    def __init__(self):
        self.model = self.load_trained_model()
        self.pattern_db = FraudPatternDatabase()
        self.anomaly_detector = IsolationForest()
        
    async def analyze(
        self,
        parcel: ParcelData,
        verifications: List[VerificationResult]
    ) -> FraudScore:
        # Feature extraction
        features = self.extract_features(parcel, verifications)
        
        # Known fraud pattern matching
        pattern_score = self.pattern_db.match_patterns(features)
        
        # Deep learning fraud detection
        dl_score = self.model.predict(features)[0]
        
        # Anomaly detection
        anomaly_score = self.anomaly_detector.decision_function(features)[0]
        
        # Temporal consistency check
        temporal_score = self.check_temporal_consistency(
            parcel.history,
            verifications
        )
        
        # Geographic validation
        geo_score = self.validate_geography(
            parcel.claimed_location,
            parcel.verified_boundaries
        )
        
        # Combine scores with weighted average
        final_score = self.combine_scores({
            'pattern': (pattern_score, 0.25),
            'deep_learning': (dl_score, 0.30),
            'anomaly': (anomaly_score, 0.20),
            'temporal': (temporal_score, 0.15),
            'geographic': (geo_score, 0.10)
        })
        
        return FraudScore(
            overall=final_score,
            confidence=self.calculate_confidence(features),
            risk_factors=self.identify_risk_factors(features)
        )
    
    def extract_features(self, parcel, verifications):
        """Extract 150+ features for fraud detection"""
        features = []
        
        # Parcel characteristics
        features.extend([
            parcel.area,
            parcel.perimeter,
            parcel.shape_complexity,
            parcel.neighbor_count,
        ])
        
        # Verification patterns
        features.extend([
            len(verifications),
            self.calc_verification_spread(verifications),
            self.calc_time_patterns(verifications),
        ])
        
        # Historical patterns
        features.extend([
            parcel.ownership_changes_count,
            parcel.dispute_history_count,
            parcel.modification_frequency,
        ])
        
        return np.array(features)
```

### 2.5 Dispute Resolution System

#### Dispute State Machine
```rust
pub enum DisputeState {
    Initiated { claim: Claim, counter_claim: Option<Claim> },
    EvidenceCollection { evidence: Vec<Evidence>, deadline: DateTime },
    CommunityReview { votes: HashMap<ValidatorId, Vote> },
    AuthorityReview { authority: AuthorityId, decision: Option<Decision> },
    Resolved { resolution: Resolution, appeal_deadline: DateTime },
    Final { resolution: Resolution },
}

pub struct DisputeResolver {
    state_machine: StateMachine<DisputeState>,
    evidence_collector: EvidenceCollector,
    voting_system: VotingSystem,
    escalation_engine: EscalationEngine,
}

impl DisputeResolver {
    pub async fn handle_dispute(&mut self, dispute: Dispute) -> Resolution {
        match self.state_machine.current_state() {
            DisputeState::Initiated { .. } => {
                // Collect evidence from all parties
                let evidence = self.evidence_collector.collect(&dispute).await;
                self.state_machine.transition(DisputeState::EvidenceCollection {
                    evidence,
                    deadline: Utc::now() + Duration::days(7),
                });
            }
            
            DisputeState::EvidenceCollection { evidence, .. } => {
                // Community voting
                let votes = self.voting_system.conduct_vote(&evidence).await;
                
                if self.has_clear_consensus(&votes) {
                    self.resolve_by_consensus(votes)
                } else {
                    self.escalate_to_authority()
                }
            }
            
            DisputeState::AuthorityReview { .. } => {
                // Authority makes final decision
                let decision = self.await_authority_decision().await;
                self.state_machine.transition(DisputeState::Resolved {
                    resolution: decision.into(),
                    appeal_deadline: Utc::now() + Duration::days(30),
                });
            }
            
            _ => self.state_machine.get_current_resolution()
        }
    }
}
```

### 2.6 Federation Protocol

#### Cross-Border Verification
```protobuf
syntax = "proto3";

package kora.federation;

service FederationService {
    // Request verification from another country's system
    rpc RequestVerification(CrossBorderRequest) returns (CrossBorderResponse);
    
    // Share verification proof with federation members
    rpc ShareProof(ProofShareRequest) returns (ProofShareAck);
    
    // Query verification status across federation
    rpc QueryStatus(FederatedQuery) returns (FederatedStatus);
    
    // Establish trust relationship
    rpc EstablishTrust(TrustRequest) returns (TrustAgreement);
}

message CrossBorderRequest {
    string requesting_country = 1;
    string target_country = 2;
    ParcelIdentifier parcel = 3;
    repeated VerificationClaim claims = 4;
    bytes requester_signature = 5;
    int64 timestamp = 6;
}

message CrossBorderResponse {
    VerificationStatus status = 1;
    CryptographicProof proof = 2;
    repeated CrossBorderAttestation attestations = 3;
    string verification_url = 4;
    int64 timestamp = 5;
    bytes responder_signature = 6;
}
```


## 3. Data Architecture

### 3.1 Event Sourcing

```rust
// All state changes are events
#[derive(Serialize, Deserialize)]
pub enum VerificationEvent {
    VerificationRequested {
        id: Uuid,
        parcel: ParcelId,
        requester: RequesterId,
        timestamp: DateTime<Utc>,
    },
    SourceVerified {
        id: Uuid,
        source: SourceId,
        result: VerificationResult,
        confidence: f64,
    },
    FraudDetected {
        id: Uuid,
        risk_score: f64,
        risk_factors: Vec<RiskFactor>,
    },
    ProofGenerated {
        id: Uuid,
        proof: CryptographicProof,
        merkle_root: Hash,
    },
    DisputeRaised {
        id: Uuid,
        claimant: UserId,
        claim: Claim,
    },
    DisputeResolved {
        id: Uuid,
        resolution: Resolution,
        authority: Option<AuthorityId>,
    },
}

// Event store
pub struct EventStore {
    db: FoundationDB,
    projections: HashMap<String, Projection>,
}

impl EventStore {
    pub async fn append(&self, event: VerificationEvent) -> Result<()> {
        // Store event immutably
        let key = format!("events:{}:{}", event.id(), event.timestamp());
        self.db.set(&key, &event).await?;
        
        // Update projections
        for projection in self.projections.values() {
            projection.handle(&event).await?;
        }
        
        Ok(())
    }
    
    pub async fn replay(&self, from: DateTime<Utc>) -> Vec<VerificationEvent> {
        self.db.range_scan(&format!("events:*:{}", from))
            .await
            .into_iter()
            .map(|e| deserialize(e))
            .collect()
    }
}
```

### 3.2 Database Schema

```sql
-- Core verification tables
CREATE TABLE verifications (
    id UUID PRIMARY KEY,
    parcel_id UUID NOT NULL,
    maba_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,4),
    fraud_risk DECIMAL(5,4),
    
    -- Verification details
    sources_checked JSONB,
    sources_confirmed JSONB,
    
    -- Proof
    proof_hash VARCHAR(66),
    merkle_root VARCHAR(66),
    signatures JSONB,
    
    -- Metadata
    requested_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Indexes
    INDEX idx_parcel (parcel_id),
    INDEX idx_status (status),
    INDEX idx_confidence (confidence),
    INDEX idx_requested (requested_at)
);

-- Dispute management
CREATE TABLE disputes (
    id UUID PRIMARY KEY,
    verification_id UUID REFERENCES verifications(id),
    state VARCHAR(50) NOT NULL,
    
    -- Claims
    initial_claim JSONB NOT NULL,
    counter_claims JSONB,
    
    -- Evidence
    evidence JSONB,
    
    -- Resolution
    resolution JSONB,
    resolved_by VARCHAR(50), -- consensus, authority, timeout
    resolved_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fraud patterns (learned)
CREATE TABLE fraud_patterns (
    id UUID PRIMARY KEY,
    pattern_type VARCHAR(100),
    pattern_signature JSONB,
    detection_count INTEGER DEFAULT 0,
    false_positive_count INTEGER DEFAULT 0,
    confidence DECIMAL(5,4),
    
    -- Learning metadata
    first_detected TIMESTAMPTZ,
    last_detected TIMESTAMPTZ,
    last_updated TIMESTAMPTZ
);

-- Federation trust relationships
CREATE TABLE federation_trust (
    id UUID PRIMARY KEY,
    country_code VARCHAR(2),
    trust_level DECIMAL(5,4),
    public_key TEXT,
    endpoint_url VARCHAR(255),
    
    -- Metrics
    verifications_shared INTEGER DEFAULT 0,
    verifications_received INTEGER DEFAULT 0,
    dispute_rate DECIMAL(5,4),
    
    -- Status
    established_at TIMESTAMPTZ,
    last_interaction TIMESTAMPTZ,
    status VARCHAR(50)
);
```


## 4. API Architecture

### 4.1 REST API

```yaml
openapi: 3.0.0
info:
  title: KORA Verification Oracle API
  version: 1.0.0

paths:
  /api/v1/kora/verify:
    post:
      summary: Request verification
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                parcel_id:
                  type: string
                verification_type:
                  type: string
                  enum: [full, quick, government_only]
                urgency:
                  type: string
                  enum: [normal, high, critical]
      responses:
        200:
          description: Verification initiated
          content:
            application/json:
              schema:
                type: object
                properties:
                  verification_id:
                    type: string
                  status:
                    type: string
                  estimated_completion:
                    type: string
  
  /api/v1/kora/proof/{verification_id}:
    get:
      summary: Get cryptographic proof
      parameters:
        - name: verification_id
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Proof retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CryptographicProof'
  
  /api/v1/kora/dispute:
    post:
      summary: Raise dispute
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                verification_id:
                  type: string
                claim:
                  type: object
                evidence:
                  type: array
                  items:
                    type: object
      responses:
        201:
          description: Dispute created
          content:
            application/json:
              schema:
                type: object
                properties:
                  dispute_id:
                    type: string
                  status:
                    type: string
                  next_steps:
                    type: array
                    items:
                      type: string

components:
  schemas:
    CryptographicProof:
      type: object
      properties:
        merkle_root:
          type: string
        merkle_path:
          type: array
          items:
            type: string
        signatures:
          type: array
          items:
            type: object
            properties:
              signer:
                type: string
              signature:
                type: string
        timestamp:
          type: string
        expires_at:
          type: string
```

### 4.2 gRPC Service

```protobuf
syntax = "proto3";

package kora.verification;

service VerificationService {
    // Stream verification updates in real-time
    rpc StreamVerification(VerificationRequest) returns (stream VerificationUpdate);
    
    // Batch verification for multiple parcels
    rpc BatchVerify(BatchVerificationRequest) returns (BatchVerificationResponse);
    
    // Validate an external proof
    rpc ValidateProof(ProofValidationRequest) returns (ProofValidationResponse);
}

message VerificationUpdate {
    string verification_id = 1;
    string status = 2;
    double confidence = 3;
    repeated SourceResult sources = 4;
    int64 timestamp = 5;
}

message BatchVerificationRequest {
    repeated ParcelIdentifier parcels = 1;
    VerificationOptions options = 2;
}

message BatchVerificationResponse {
    map<string, VerificationResult> results = 1;
    int32 successful = 2;
    int32 failed = 3;
}
```


## 5. Security Architecture

### 5.1 Cryptographic Infrastructure

```yaml
cryptography:
  algorithms:
    signatures: Ed25519
    hashing: SHA3-256
    merkle_tree: Blake2b
    zero_knowledge: Groth16
    
  key_management:
    storage: Hardware Security Module (HSM)
    rotation: Quarterly
    backup: 3-of-5 Shamir Secret Sharing
    
  proof_structure:
    size: <2KB compressed
    validity: 365 days
    revocation: CRL + OCSP
```

### 5.2 Security Controls

```rust
pub struct SecurityLayer {
    rate_limiter: RateLimiter,
    ddos_protection: DDoSProtection,
    fraud_detector: FraudDetector,
    audit_logger: AuditLogger,
}

impl SecurityLayer {
    pub async fn validate_request(&self, request: &Request) -> SecurityResult {
        // Rate limiting
        self.rate_limiter.check(request.client_id)?;
        
        // DDoS protection
        if self.ddos_protection.is_attack_pattern(request) {
            return Err(SecurityError::PotentialDDoS);
        }
        
        // Fraud detection
        let fraud_risk = self.fraud_detector.assess(request);
        if fraud_risk > 0.8 {
            self.audit_logger.log_suspicious_activity(request);
            return Err(SecurityError::HighFraudRisk);
        }
        
        // Audit logging
        self.audit_logger.log_access(request);
        
        Ok(SecurityResult::Approved)
    }
}
```


## 6. Performance Specifications

### 6.1 Performance Targets

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| Verification Latency | <1s | - | P95 |
| Proof Generation | <100ms | - | Average |
| Throughput | 100K/hour | - | Peak |
| Dispute Resolution | <24 hours | - | Average |
| Federation Sync | <5s | - | Cross-border |

### 6.2 Optimization Strategies

```yaml
optimizations:
  caching:
    - Redis for hot verifications
    - CDN for static proofs
    - Local cache for frequently accessed
    
  parallelization:
    - Concurrent source verification
    - Batch processing for multiple parcels
    - Async I/O throughout
    
  database:
    - Read replicas for queries
    - Partitioning by country/region
    - Index optimization for common queries
```


## 7. Monitoring & Observability

### 7.1 Metrics

```yaml
metrics:
  business:
    - verifications_per_hour
    - verification_accuracy
    - fraud_detection_rate
    - dispute_resolution_time
    - federation_success_rate
    
  technical:
    - api_latency_p50_p95_p99
    - proof_generation_time
    - cache_hit_rate
    - database_query_time
    - error_rate
    
  security:
    - failed_verification_attempts
    - fraud_attempts_blocked
    - ddos_attacks_mitigated
    - unauthorized_access_attempts
```

### 7.2 Monitoring Stack

```yaml
monitoring:
  metrics: Prometheus + Grafana
  logs: ELK Stack (Elasticsearch, Logstash, Kibana)
  traces: Jaeger
  alerts: PagerDuty
  dashboards:
    - Real-time verification status
    - Fraud detection dashboard
    - Federation health
    - System performance
```


## 8. Disaster Recovery

### 8.1 Backup Strategy

```yaml
backups:
  databases:
    frequency: Continuous replication
    retention: 7 years (legal requirement)
    encryption: AES-256
    
  proofs:
    storage: Immutable object storage
    replication: 3 regions
    verification: Daily integrity checks
    
  event_store:
    type: Append-only
    snapshots: Daily
    replay_capability: Full history
```

### 8.2 Recovery Procedures

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Node failure | 0 | 0 | Automatic failover |
| Region failure | 5 min | 1 min | DNS failover |
| Data corruption | 1 hour | 5 min | Restore from event store |
| Complete disaster | 4 hours | 1 hour | Full recovery from backup |


## Appendix A: Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| Core Language | Rust | Performance, safety, cryptography |
| ML Framework | TensorFlow | Fraud detection models |
| Database | FoundationDB | ACID, distributed, consistent |
| Cache | Redis | Performance, geospatial support |
| Message Bus | NATS | Low latency, high throughput |
| Cryptography | arkworks-rs | Zero-knowledge proofs |


## Appendix B: Verification Source Adapters

| Source | Adapter | Protocol | Availability |
|--------|---------|----------|--------------|
| Kenya Lands | KenyaAdapter | REST API | 99% |
| Ghana Registry | GhanaAdapter | SOAP | 95% |
| Nigeria Cadastre | NigeriaAdapter | Custom | 90% |
| Sentinel-2 | SentinelAdapter | OData | 99.5% |
| Community | MobileAdapter | gRPC | Variable |


**Document Status**: Technical specification for implementation  
**Review Cycle**: Every sprint  
**Approval**: Chief Security Officer & Chief Architect
