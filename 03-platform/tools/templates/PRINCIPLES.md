# The 30 Engineering Principles

Developer reference for the GTCX ecosystem. Every protocol, service, and application is evaluated against these principles. They are grouped into six categories of five.

## Trust

### P1 Proof

Every claim about a commodity -- origin, identity, compliance, custody -- requires cryptographic proof. No assertion is accepted without verifiable evidence.

This means: use digital signatures, hash commitments, and zero-knowledge proofs. Never trust a claim that cannot be independently verified.

### P2 Private

Sensitive data is disclosed only to authorized parties, and only the minimum required for the operation. Data sovereignty belongs to the entity that generated it.

This means: encrypt at rest and in transit, use selective disclosure, and never expose more than the verifier needs. Personally identifiable information stays under the subject's control.

### P3 Auditable

Every verification event, state change, and decision produces a tamper-evident audit record. Auditors can reconstruct the full history of any entity.

This means: append-only logs, signed audit entries, and deterministic event ordering. Every operation that changes state must be traceable to a source.

### P4 Immutable

Once a verification record is committed, it cannot be altered or deleted. Corrections are new records that reference the original.

This means: content-addressed storage, hash chains, and no UPDATE/DELETE on verification records. Mistakes are corrected by issuing new attestations, not by rewriting history.

### P5 Transparent

Verification processes, scoring algorithms, and compliance criteria are publicly inspectable. Stakeholders can understand how decisions are made.

This means: open-source verification logic, published scoring models, and documented decision criteria. No black-box compliance.

## Sovereignty

### P6 Sovereign

Nations and communities retain full authority over their data, regulations, and cultural practices. No external entity can override local governance.

This means: jurisdiction-specific deployment configurations, local data residency, and regulatory frameworks that respect national law. The platform adapts to the jurisdiction, not the other way around.

### P7 Open

All protocols are open-source. No vendor lock-in, no proprietary dependencies for core verification functions.

This means: MIT/Apache-2.0 licensing, open protocol specifications, and public reference implementations. Any party can audit, fork, or build on the protocol.

### P8 Federated

Authority is distributed across multiple independent nodes. No single entity controls the verification network.

This means: multi-stakeholder consensus (PANX oracle), distributed validator sets, and no central authority that can unilaterally approve or deny verification.

### P9 Governed

Protocol changes follow a defined governance process with stakeholder input. Changes are proposed, reviewed, and ratified before deployment.

This means: governance proposals, voting mechanisms, and versioned protocol specifications. Breaking changes require consensus across stakeholders.

### P10 Compliant

Regulatory compliance is built into the protocol layer, not bolted on afterward. The system is designed to satisfy EU CBAM, LBMA, Dodd-Frank, and jurisdictional requirements.

This means: GCI scoring across 12 compliance domains, automated regulatory reporting, and certification workflows that produce legally admissible evidence.

## Architecture

### P11 Secure

Zero-trust security model. Every request is authenticated and authorized. Defense in depth at every layer.

This means: mutual TLS, API key rotation, role-based access control, input validation at all boundaries, and no implicit trust between services.

### P12 Resilient

Systems continue operating under partial failure. No single point of failure in the critical path.

This means: circuit breakers, retry with backoff, graceful degradation, health checks, and automated failover. A single node going down must not take the system offline.

### P13 Modular

Each package, service, and protocol has a single responsibility with clear boundaries. Components are composable and independently deployable.

This means: well-defined interfaces between packages, no circular dependencies, and the ability to use any component without importing the entire ecosystem.

### P14 Deployable

Deployments are automated, reproducible, and reversible. Any commit on main can be deployed to production with a single command.

This means: containerized services, infrastructure-as-code, CI/CD pipelines, canary deployments, and rollback procedures. No manual deployment steps.

### P15 Observable

Every service emits structured metrics, logs, and traces. Operators can diagnose issues without reading source code.

This means: Prometheus metrics, structured JSON logging, distributed tracing (OpenTelemetry), and dashboards for every service. Alert on symptoms, not just errors.

## Frontier

### P16 Ubuntu

Cultural intelligence is embedded in verification processes. The system respects local traditions, community structures, and indigenous knowledge systems.

This means: ANISA cultural context detection, community-weighted consensus, and compliance processes adapted to Ubuntu (West Africa), Guanxi (East Asia), Jugaad (South Asia), Jeitinho (Latin America), and Wasta (Middle East) frameworks.

### P17 Offline

Every critical operation works without internet connectivity. Field operations in rural areas with no network are a primary use case, not an edge case.

This means: offline-first data storage, conflict resolution on reconnection, USSD fallback interfaces, and local cryptographic verification without calling a remote server.

### P18 Localized

Interfaces, documentation, and compliance outputs are adapted to local languages, units, currencies, and cultural conventions.

This means: i18n/l10n infrastructure, RTL layout support, locale-aware formatting, and translation workflows for all user-facing content.

### P19 Accessible

The system is usable by people of all abilities, literacy levels, and technical backgrounds. Accessibility is a requirement, not a feature.

This means: WCAG 2.1 AA compliance, screen reader compatibility, voice interfaces for low-literacy users, and progressive enhancement for low-end devices.

### P20 Hardware

Physical commodities require physical-digital binding. Hardware devices (NFC tags, secure elements) bridge the gap between the physical and digital worlds.

This means: TapKit NFC verification, VaultKit secure custody, tamper-evident seals, and device attestation. The chain of custody does not break at the physical boundary.

## Scale

### P21 Universal

The verification infrastructure works for any commodity type (gold, cobalt, lithium, timber) in any jurisdiction. Domain-specific logic is configuration, not code.

This means: commodity-agnostic data models, jurisdiction-specific configuration files, and protocol specifications that are not hard-coded to a single mineral or country.

### P22 Portable

Services run on any infrastructure -- cloud, on-premise, edge devices, or air-gapped environments. No hard dependency on a specific cloud provider.

This means: containerized deployments, environment-agnostic configuration, and no use of proprietary cloud services in the critical path.

### P23 Interoperable

The system integrates with existing industry standards, government systems, and legacy infrastructure. GTCX does not require the world to adopt new formats.

This means: REST/gRPC APIs, standard data formats (JSON, CBOR), W3C DID/VC compliance, and migration adapters for existing systems (AMANI, KORA, MABA).

### P24 Scalable

Architecture handles 10x growth without redesign. Performance degrades linearly, not exponentially, under load.

This means: horizontal scaling, stateless services, event-driven processing, connection pooling, and load testing as part of CI.

### P25 Extensible

New capabilities (commodities, jurisdictions, compliance domains) can be added without modifying existing code. The system is designed for extension.

This means: plugin architectures, hook systems, configuration-driven behavior, and stable public APIs that new modules can build against.

## Craft

### P26 Researched

Design decisions are backed by evidence -- academic research, field studies, market data, or user research. Assumptions are stated and validated.

This means: ADRs (Architecture Decision Records) for significant choices, cited sources for cultural intelligence models, and user research informing product decisions.

### P27 Documented

Every system, API, data model, and architectural decision is documented. Documentation is maintained alongside code, not as an afterthought.

This means: JSDoc/rustdoc for public APIs, README in every directory, ADRs for architecture decisions, and runbooks for operational procedures.

### P28 Adaptive

The system learns from real-world usage and community feedback. Models are retrained, processes are refined, and assumptions are revisited.

This means: feedback loops from field operations, model retraining pipelines, A/B testing for verification processes, and regular retrospectives on cultural accuracy.

### P29 Tested

Every module has automated tests. Critical paths have integration tests. Cryptographic operations have property-based tests. Untested code is unverified code.

This means: unit tests for business logic, integration tests for API boundaries, property tests for crypto, end-to-end tests for critical user flows, and test coverage as a merge gate.

### P30 Intentional

Every line of code, every dependency, and every architectural choice serves a stated purpose. Complexity is justified, not accumulated.

This means: no dead code, no speculative features, no dependencies without justification, and regular pruning of unused modules. If you cannot explain why something exists, remove it.

## Cross-Reference: Primary Ownership

Each principle has a primary owner repo where its implementation is most critical. Universal principles apply to every repo.

| Principle         | Primary Owner                     | Category     |
| ----------------- | --------------------------------- | ------------ |
| P1 Proof          | gtcx-core                         | Trust        |
| P2 Private        | gtcx-core                         | Trust        |
| P3 Auditable      | gtcx-protocols, gtcx-complianceos | Trust        |
| P4 Immutable      | gtcx-core                         | Trust        |
| P5 Transparent    | gtcx-protocols                    | Trust        |
| P6 Sovereign      | gtcx-platforms                    | Sovereignty  |
| P7 Open           | Universal                         | Sovereignty  |
| P8 Federated      | gtcx-protocols                    | Sovereignty  |
| P9 Governed       | gtcx-platforms                    | Sovereignty  |
| P10 Compliant     | gtcx-complianceos                 | Sovereignty  |
| P11 Secure        | gtcx-core                         | Architecture |
| P12 Resilient     | gtcx-infrastructure               | Architecture |
| P13 Modular       | Universal                         | Architecture |
| P14 Deployable    | gtcx-infrastructure               | Architecture |
| P15 Observable    | gtcx-infrastructure               | Architecture |
| P16 Ubuntu        | gtcx-intelligence                 | Frontier     |
| P17 Offline       | gtcx-app                          | Frontier     |
| P18 Localized     | gtcx-app, gtcx-design             | Frontier     |
| P19 Accessible    | gtcx-app, gtcx-design             | Frontier     |
| P20 Hardware      | gtcx-hardware                     | Frontier     |
| P21 Universal     | gtcx-core                         | Scale        |
| P22 Portable      | gtcx-infrastructure               | Scale        |
| P23 Interoperable | gtcx-protocols                    | Scale        |
| P24 Scalable      | gtcx-infrastructure               | Scale        |
| P25 Extensible    | gtcx-agentic                      | Scale        |
| P26 Researched    | gtcx-docs                         | Craft        |
| P27 Documented    | Universal                         | Craft        |
| P28 Adaptive      | gtcx-intelligence                 | Craft        |
| P29 Tested        | Universal                         | Craft        |
| P30 Intentional   | Universal                         | Craft        |
