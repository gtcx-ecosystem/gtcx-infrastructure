# KORA - Backend Verification Architecture

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Tech Stack**: Rust, PostgreSQL, Neo4j  


## 1. Core Services Architecture

### Verification Engine (Rust)
```rust
// Core verification service structure
pub struct VerificationEngine {
    registry_adapter: Box<dyn RegistryAdapter>,
    proof_generator: ProofGenerator,
    consensus_manager: ConsensusManager,
    fraud_detector: FraudDetector,
}

impl VerificationEngine {
    pub async fn verify_ownership(&self, parcel_id: &str) -> VerificationResult {
        // Multi-source verification
        let gov_result = self.registry_adapter.verify_government(parcel_id).await;
        let community_result = self.verify_community(parcel_id).await;
        let satellite_result = self.verify_satellite(parcel_id).await;
        
        // Generate consensus
        let consensus = self.consensus_manager.calculate(vec![
            gov_result,
            community_result,
            satellite_result,
        ]);
        
        // Create cryptographic proof
        let proof = self.proof_generator.create_proof(&consensus);
        
        VerificationResult {
            confidence: consensus.confidence,
            proof,
            sources: consensus.sources,
        }
    }
}
```

## 2. API Endpoints

### REST API
```yaml
POST /api/v1/verify
  Request:
    parcel_id: string
    owner_details: object
    evidence: array
  Response:
    verification_id: uuid
    status: verified|pending|disputed
    confidence: float
    proof: object

GET /api/v1/proof/{verification_id}
  Response:
    merkle_root: string
    signatures: array
    timestamp: datetime
    validity_period: duration

POST /api/v1/dispute
  Request:
    verification_id: uuid
    dispute_type: string
    evidence: array
  Response:
    dispute_id: uuid
    status: submitted
    estimated_resolution: datetime

GET /api/v1/verification/history/{parcel_id}
  Response:
    verifications: array
    disputes: array
    current_status: object
```

## 3. Database Schema

### PostgreSQL - Transactional Data
```sql
-- Verification records
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id VARCHAR(255) NOT NULL,
    owner_id VARCHAR(255),
    confidence_score DECIMAL(5,2),
    status VARCHAR(50),
    proof_hash VARCHAR(64),
    sources JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    INDEX idx_parcel (parcel_id),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status)
);

-- Dispute records
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES verifications(id),
    dispute_type VARCHAR(50),
    claimant_id VARCHAR(255),
    evidence JSONB,
    status VARCHAR(50),
    resolution JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Fraud patterns
CREATE TABLE fraud_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(100),
    indicators JSONB,
    severity VARCHAR(20),
    detection_count INTEGER DEFAULT 0,
    last_detected TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Neo4j - Graph Relationships
```cypher
// Ownership chain
CREATE (p:Parcel {id: $parcel_id})
CREATE (o:Owner {id: $owner_id})
CREATE (o)-[:OWNS {since: $date, verified: true}]->(p)

// Verification network
CREATE (v:Verification {id: $verification_id})
CREATE (s1:Source {type: 'government', confidence: 0.95})
CREATE (s2:Source {type: 'community', confidence: 0.85})
CREATE (v)-[:VERIFIED_BY]->(s1)
CREATE (v)-[:VERIFIED_BY]->(s2)

// Trust relationships
MATCH (a:Authority {id: $authority_id})
MATCH (v:Verification {id: $verification_id})
CREATE (a)-[:TRUSTS {level: 0.9}]->(v)
```

## 4. Cryptographic Proof Generation

```rust
use sha3::{Sha3_256, Digest};
use ed25519_dalek::{Keypair, Signature, Signer};

pub struct ProofGenerator {
    keypair: Keypair,
    merkle_tree: MerkleTree,
}

impl ProofGenerator {
    pub fn create_proof(&self, data: &VerificationData) -> CryptographicProof {
        // Build Merkle tree from verification sources
        let leaves: Vec<Hash> = data.sources
            .iter()
            .map(|s| self.hash_source(s))
            .collect();
        
        let merkle_root = self.merkle_tree.build(leaves);
        
        // Sign the root
        let signature = self.keypair.sign(&merkle_root);
        
        // Generate zero-knowledge proof
        let zk_proof = self.generate_zk_proof(data);
        
        CryptographicProof {
            merkle_root,
            signature: signature.to_bytes(),
            zk_proof,
            timestamp: Utc::now(),
            validity_period: Duration::days(365),
        }
    }
    
    fn hash_source(&self, source: &VerificationSource) -> Hash {
        let mut hasher = Sha3_256::new();
        hasher.update(source.as_bytes());
        hasher.finalize().into()
    }
}
```

## 5. Consensus Algorithm

```rust
pub struct ConsensusManager {
    threshold: f64,
    weights: HashMap<SourceType, f64>,
}

impl ConsensusManager {
    pub fn calculate(&self, sources: Vec<SourceResult>) -> Consensus {
        let mut weighted_sum = 0.0;
        let mut total_weight = 0.0;
        
        for source in &sources {
            let weight = self.weights.get(&source.source_type)
                .unwrap_or(&1.0);
            weighted_sum += source.confidence * weight;
            total_weight += weight;
        }
        
        let confidence = weighted_sum / total_weight;
        
        Consensus {
            confidence,
            sources,
            threshold_met: confidence >= self.threshold,
            timestamp: Utc::now(),
        }
    }
}
```

## 6. Fraud Detection Engine

```python
class FraudDetector:
    def __init__(self):
        self.ml_model = self.load_model()
        self.pattern_matcher = PatternMatcher()
        
    async def detect_fraud(self, verification_request):
        """Multi-layer fraud detection"""
        
        # Rule-based checks
        rule_flags = self.check_rules(verification_request)
        
        # ML-based anomaly detection
        ml_score = self.ml_model.predict_proba([
            self.extract_features(verification_request)
        ])[0][1]
        
        # Pattern matching
        pattern_matches = self.pattern_matcher.match(
            verification_request
        )
        
        # Combine signals
        fraud_risk = self.combine_signals(
            rule_flags,
            ml_score,
            pattern_matches
        )
        
        if fraud_risk > 0.7:
            await self.flag_for_review(verification_request)
            
        return FraudAssessment(
            risk_score=fraud_risk,
            flags=rule_flags,
            patterns=pattern_matches
        )
```

## 7. Federation Protocol

```rust
// Cross-border verification
pub struct FederationClient {
    partners: Vec<PartnerRegistry>,
    trust_scores: HashMap<String, f64>,
}

impl FederationClient {
    pub async fn federated_verify(&self, request: FederationRequest) 
        -> FederationResult {
        
        // Select trusted partners
        let trusted_partners = self.partners
            .iter()
            .filter(|p| self.trust_scores[&p.id] > 0.7)
            .collect();
        
        // Parallel verification requests
        let mut handles = vec![];
        for partner in trusted_partners {
            let handle = tokio::spawn(
                partner.verify(request.clone())
            );
            handles.push(handle);
        }
        
        // Collect results
        let results = futures::future::join_all(handles).await;
        
        // Build consensus
        self.build_federated_consensus(results)
    }
}
```

## 8. Event Sourcing

```rust
// All state changes as events
#[derive(Serialize, Deserialize)]
pub enum VerificationEvent {
    VerificationRequested {
        id: Uuid,
        parcel_id: String,
        timestamp: DateTime<Utc>,
    },
    SourceVerified {
        verification_id: Uuid,
        source: SourceType,
        result: SourceResult,
    },
    ConsensusReached {
        verification_id: Uuid,
        confidence: f64,
    },
    ProofGenerated {
        verification_id: Uuid,
        proof_hash: String,
    },
    DisputeFiled {
        verification_id: Uuid,
        dispute_id: Uuid,
        reason: String,
    },
}

pub struct EventStore {
    events: Vec<VerificationEvent>,
}

impl EventStore {
    pub fn append(&mut self, event: VerificationEvent) {
        self.events.push(event);
        self.publish_to_stream(&event);
    }
    
    pub fn replay(&self, from: DateTime<Utc>) -> Vec<VerificationEvent> {
        self.events
            .iter()
            .filter(|e| e.timestamp() > from)
            .cloned()
            .collect()
    }
}
```

## 9. Cache Strategy

```yaml
Redis_Caching:
  verification_cache:
    key: "verify:{parcel_id}"
    ttl: 3600  # 1 hour
    
  proof_cache:
    key: "proof:{verification_id}"
    ttl: 86400  # 24 hours
    
  dispute_cache:
    key: "dispute:{dispute_id}"
    ttl: 7200  # 2 hours

Invalidation:
  - On new verification
  - On dispute filed
  - On status change
```

## 10. Performance Optimization

```rust
// Async parallel processing
pub async fn batch_verify(parcels: Vec<String>) -> Vec<VerificationResult> {
    let mut tasks = Vec::new();
    
    for parcel_id in parcels {
        let task = tokio::spawn(async move {
            verify_single(parcel_id).await
        });
        tasks.push(task);
    }
    
    futures::future::join_all(tasks)
        .await
        .into_iter()
        .filter_map(Result::ok)
        .collect()
}

// Connection pooling
lazy_static! {
    static ref DB_POOL: Pool<PostgresConnectionManager> = {
        let manager = PostgresConnectionManager::new(
            "host=localhost user=kora dbname=verifications",
            TlsMode::Require(TlsConnector::new().unwrap())
        ).unwrap();
        
        Pool::builder()
            .max_size(50)
            .min_idle(Some(10))
            .build(manager)
            .unwrap()
    };
}
```

## 11. Monitoring & Metrics

```rust
// Prometheus metrics
lazy_static! {
    static ref VERIFICATION_COUNTER: IntCounter = register_int_counter!(
        "kora_verifications_total",
        "Total number of verifications"
    ).unwrap();
    
    static ref VERIFICATION_DURATION: Histogram = register_histogram!(
        "kora_verification_duration_seconds",
        "Verification processing time"
    ).unwrap();
    
    static ref FRAUD_DETECTIONS: IntCounter = register_int_counter!(
        "kora_fraud_detections_total",
        "Total fraud detections"
    ).unwrap();
}
```


**Document Status**: Backend architecture specification  
**Language**: Rust (primary), Python (ML components)  
**Review Cycle**: Every sprint  
**Owner**: Backend Team Lead
