# Governance

Network governance, validator participation, protocol versioning, and dispute resolution.

---

## Governance Model

GTCX Protocol governance is multi-stakeholder. No single entity controls the network:

| Stakeholder                 | Role in Governance                                                     |
| --------------------------- | ---------------------------------------------------------------------- |
| **Government validators**   | Jurisdiction-level compliance rules, license issuance/revocation       |
| **Buyer consortia**         | Settlement conditions, quality standards, PANX validator participation |
| **Community organizations** | Represent producer interests as PANX validators                        |
| **RCOs**                    | Field-level protocol operation and producer onboarding                 |
| **Protocol maintainers**    | Technical development, schema versioning, security patches             |

---

## PANX Consensus

PANX is the on-chain governance layer. All high-value operations require a PANX consensus attestation:

- **Quorum:** 2/3 of active validators must approve
- **Byzantine fault tolerance:** Tolerates up to 1/3 malicious or unavailable validators
- **Validator minimum:** 3 validators minimum; recommended 5–7
- **Attestation scope:** High-value VaultMark transfers, all PvP settlements

Validators do not trade or hold custody. Their role is attestation only.

---

## Becoming a Validator

Validators are institutional entities — government bodies, buyer consortia, or recognized community organizations.

**Requirements:**

1. Hold a valid TradePass credential with the `VALIDATOR` role
2. Operate a PANX node with sufficient uptime (minimum 99% recommended)
3. Meet jurisdiction-specific stake or authorization requirements
4. Maintain a validator reputation score above the network minimum

**Process:**

1. Submit a validator application to the relevant jurisdiction authority
2. Government or consortium authority issues a `VALIDATOR` credential via TradePass
3. Register the PANX node with the network bootstrap nodes
4. Begin participating in consensus requests

Oracle participants (price data submission) follow the same process with an additional oracle key registration step.

---

## Protocol Versioning

The GTCX Protocol follows semantic versioning:

| Change                         | Version Bump | Backward Compatible     |
| ------------------------------ | ------------ | ----------------------- |
| New optional field in a schema | MINOR        | Yes                     |
| New required field             | MAJOR        | No — migration required |
| Removed field                  | MAJOR        | No — migration required |
| Bug fix, security patch        | PATCH        | Yes                     |

**Breaking changes:**

- Announced via GitHub Releases with minimum 30-day notice for MAJOR bumps
- Migration functions shipped in `@gtcx/schemas/migrations/` before the breaking version is tagged
- Old schema versions remain valid for a deprecation period defined in the release notes

---

## Dispute Resolution

### PvP Settlement Disputes

Settlement disputes follow a three-tier process:

| Tier        | Timeframe | Resolution Mechanism                                               |
| ----------- | --------- | ------------------------------------------------------------------ |
| Automatic   | 24 hours  | System-mediated — evidence review against escrow conditions        |
| Mediation   | 72 hours  | Designated mediator with access to custody and payment proofs      |
| Arbitration | 7 days    | Binding arbitration panel; decision is final and executed on-chain |

Disputes are initiated by either settlement party via `client.settlement.dispute()`.

### Credential Disputes

Credential revocation can be appealed through a three-tier process:

| Tier           | Reviewer                                                       |
| -------------- | -------------------------------------------------------------- |
| Administrative | Issuing authority review                                       |
| Technical      | Independent technical review of GCI score or verification data |
| Arbitration    | External arbitration panel                                     |

---

## Government Authority Participation

National and sub-national regulatory bodies participate as:

1. **PANX government validators** — Attest to settlement and transfer compliance within their jurisdiction
2. **License authorities** — Issue and revoke operator licenses referenced by TradePass credentials
3. **Compliance data recipients** — Access aggregated compliance reports for their jurisdiction via the `compliance.report` permission scope
4. **Tax/royalty recipients** — Receive their fee allocation from PvP settlement (part of the 30% Sovereign share)

Government participation requires a TradePass credential with the `GOVERNMENT` / `Authority ID` credential type.

---

## Protocol Upgrade Process

1. **Proposal** — Protocol change proposed in the GitHub repository as an RFC issue
2. **Discussion** — 14-day open comment period for all network participants
3. **Vote** — PANX consensus vote by validator nodes (2/3 majority required for MAJOR changes)
4. **Implementation** — Protocol maintainers implement and release
5. **Deployment** — Network participants update within the migration window
6. **Activation** — New version activates at a pre-announced block height or timestamp

Security patches bypass the full process — they are released immediately and announced post-deployment.

---

## Reference

- [operator-types.md](../2-specs/operator-types.md)
- [protocol-index.md](../2-specs/protocol-index.md)
