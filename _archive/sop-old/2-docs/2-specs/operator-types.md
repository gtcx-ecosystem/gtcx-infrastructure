# Operator Types

The GTCX Protocol supports 12 credential types representing every participant role in commodity supply chains. All roles are issued as TradePass verifiable credentials and enforced at the protocol level via RBAC.

---

## 1. The 12 Credential Types

| #   | Credential        | Purpose                                           | Operator Sub-Types                                                                   |
| --- | ----------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | **TradePass**     | Universal identity — required by all participants | All roles                                                                            |
| 2   | **Producer ID**   | Extraction and primary production                 | `PRODUCER_INDIVIDUAL`, `PRODUCER_GROUP`, `PRODUCER_OPERATION`, `PRODUCER_INDUSTRIAL` |
| 3   | **Site ID**       | Physical location identity                        | Extraction sites, processing facilities, vaults, ports                               |
| 4   | **Aggregator ID** | Collection and consolidation                      | `AGGREGATOR_LOCAL`, `AGGREGATOR_REGIONAL`                                            |
| 5   | **Processor ID**  | Commodity transformation                          | `PROCESSOR_PRIMARY`, `PROCESSOR_REFINER`                                             |
| 6   | **Trader ID**     | Trading and export                                | `TRADER_DEALER`, `TRADER_EXPORTER`, `TRADER_HOUSE`                                   |
| 7   | **Custody ID**    | Secure storage                                    | `CUSTODY_VAULT`                                                                      |
| 8   | **Logistics ID**  | Transportation                                    | `LOGISTICS_LOCAL`, `LOGISTICS_SECURE`                                                |
| 9   | **Certifier ID**  | Third-party verification                          | `CERTIFICATION`                                                                      |
| 10  | **Buyer ID**      | End purchase                                      | `BUYER_INDUSTRIAL`, `BUYER_RETAIL`, `BUYER_INSTITUTIONAL`                            |
| 11  | **Authority ID**  | Government and regulatory                         | `GOVERNMENT`                                                                         |
| 12  | **Finance ID**    | Financial services                                | `FINANCE`                                                                            |

---

## 2. Role Hierarchy

```
VALIDATORS (System Trust Layer)
  ├── VALIDATOR   ──▶ Attest claims, participate in PANX consensus
  └── INSPECTOR   ──▶ Physical verification via VXA™ agent

OPERATORS (Infrastructure Layer)
  ├── REFINER     ──▶ Transform commodities, add value
  ├── VAULT       ──▶ Secure long-term custody and storage
  ├── AGGREGATOR  ──▶ Collect, consolidate, transport
  └── RCO         ──▶ Licensed aggregator-buyer, producer support

MARKET PARTICIPANTS (Transaction Layer)
  ├── BUYER       ──▶ Purchase verified assets on SGX/AGX
  └── PRODUCER    ──▶ Create assets, submit provenance claims (base role)
```

---

## 3. Role Capabilities Matrix

| Role           | Create Assets | Transfer Custody | Attest Claims | Trade | Hold Custody | Inspect |
| -------------- | :-----------: | :--------------: | :-----------: | :---: | :----------: | :-----: |
| **PRODUCER**   |      ✅       |     Out only     |       —       | Sell  |      —       |    —    |
| **RCO**        |       —       |        ✅        |      ✅       |  ✅   |   Transit    |    —    |
| **AGGREGATOR** |       —       |        ✅        |       —       |  ✅   |   Transit    |    —    |
| **VAULT**      |       —       |        ✅        |      ✅       |   —   |      ✅      |    —    |
| **REFINER**    |    Derived    |        ✅        |      ✅       |  ✅   |      ✅      |    —    |
| **BUYER**      |       —       |     In only      |       —       |  Buy  |      —       |    —    |
| **INSPECTOR**  |       —       |        —         |      ✅       |   —   |      —       |   ✅    |
| **VALIDATOR**  |       —       |        —         |      ✅       |   —   |      —       |    —    |

---

## 4. Role Definitions

### PRODUCER

Individuals or organizations engaged in primary commodity extraction or agriculture.

| Sub-Type              | Description                                  | Example                          |
| --------------------- | -------------------------------------------- | -------------------------------- |
| `PRODUCER_INDIVIDUAL` | Single artisanal miner or smallholder farmer | Individual gold miner in Ashanti |
| `PRODUCER_GROUP`      | Cooperative or collective                    | Coffee cooperative in Rwanda     |
| `PRODUCER_OPERATION`  | Organized small-to-medium operation          | Junior mining company            |
| `PRODUCER_INDUSTRIAL` | Large-scale industrial production            | Commercial mining enterprise     |

**Permissions:** Create VaultMark assets at extraction site, initiate PvP sales, submit GeoTag proofs, receive GCI score.

### RCO (Regional Compliance Operator)

Licensed operators who aggregate production, support producers, and connect them to formal markets. RCOs are the primary field operators of CaaS services.

**Permissions:** Accept custody transfers from producers, attest to physical verification, initiate PvP purchases, operate VIA™/VXA™ agents.

### AGGREGATOR

Operators who consolidate smaller lots into larger shipments for processing or export.

| Sub-Type              | Description                           |
| --------------------- | ------------------------------------- |
| `AGGREGATOR_LOCAL`    | Village or district-level aggregation |
| `AGGREGATOR_REGIONAL` | Regional warehouse or processing hub  |

**Permissions:** Accept and initiate custody transfers, merge VaultMark lots, sell to processors or exporters.

### VAULT

Certified secure storage operators.

**Permissions:** Accept custody for long-term storage, attest to physical condition and weight, provide custody proof for PvP settlement.

### REFINER / PROCESSOR

Operators who transform raw commodities into refined products.

| Sub-Type            | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `PROCESSOR_PRIMARY` | First-stage processing (washing station, initial assay) |
| `PROCESSOR_REFINER` | Full refinement to commodity-grade output               |

**Permissions:** Accept custody for processing, create new derived assets from processed lots, sell refined output.

### BUYER

End purchasers of verified commodities.

| Sub-Type              | Description                                      |
| --------------------- | ------------------------------------------------ |
| `BUYER_INDUSTRIAL`    | Industrial manufacturer purchasing raw materials |
| `BUYER_RETAIL`        | Retail commodity purchaser                       |
| `BUYER_INSTITUTIONAL` | Fund, bank, or sovereign wealth entity           |

**Permissions:** Fund PvP escrow, receive custody transfer on settlement, read provenance certificates.

### INSPECTOR

Authorized verifiers who conduct physical assessments in the field.

**Permissions:** Capture VXA™ evidence, submit attestation claims to GCI, access physical verification data. Cannot trade or hold custody.

### VALIDATOR

PANX consensus participants. Validators are institutional — government bodies, buyer consortia, or community organizations.

**Permissions:** Vote on consensus requests, attest to compliance claims, participate in PANX oracle price submission. Cannot trade or hold custody.

### GOVERNMENT (Authority ID)

National and sub-national regulatory bodies.

**Permissions:** Issue and revoke licenses, access compliance data for jurisdiction, participate as PANX government validator, receive tax/royalty reports from PvP.

---

## 5. Role Lifecycle

```
UNREGISTERED
     │
     │  (Submit documents + biometrics + pay registration fee)
     ▼
  PENDING     ──▶ (Rejected) ──▶ REJECTED
     │
     │  (Government or RCO approval)
     ▼
  ACTIVE       ──▶ (Compliance failure or violation) ──▶ SUSPENDED
     │                                                        │
     │  (Annual renewal with active GCI score)                │ (Appeal resolved)
     │                                                        ▼
     │                                                     ACTIVE
     │  (Serious violation or voluntary exit)
     ▼
  REVOKED  (terminal)
```

### Credential Validity

| Credential Type  | Validity Period | Renewal Requirement                    |
| ---------------- | --------------- | -------------------------------------- |
| TradePass (base) | 2 years         | Biometric re-verification              |
| Producer ID      | 1 year          | GCI score ≥50 + active mining license  |
| Aggregator ID    | 1 year          | Government license renewal             |
| Vault / Custody  | 1 year          | Insurance + facility inspection        |
| Buyer ID         | 2 years         | KYC re-verification                    |
| Validator        | 2 years         | Government or consortium reappointment |

---

## 6. Permission Scopes (TradePass RBAC)

Fine-grained permission scopes control what each role can do. Scopes are checked at the protocol boundary on every API call.

| Scope                | Description                         | Roles                                     |
| -------------------- | ----------------------------------- | ----------------------------------------- |
| `asset.create`       | Register new lots                   | PRODUCER, PROCESSOR_REFINER               |
| `asset.read`         | View asset details                  | All authenticated                         |
| `custody.transfer`   | Initiate or accept transfer         | PRODUCER, RCO, AGGREGATOR, VAULT, REFINER |
| `custody.attest`     | Add verification to custody event   | VAULT, REFINER, INSPECTOR                 |
| `escrow.create`      | Open PvP escrow                     | BUYER                                     |
| `escrow.fund`        | Fund PvP escrow                     | BUYER                                     |
| `settlement.execute` | Complete PvP settlement             | System (PANX-gated)                       |
| `gci.read`           | Read own GCI score                  | All authenticated                         |
| `gci.attest`         | Submit GCI evidence                 | INSPECTOR, VALIDATOR                      |
| `consensus.vote`     | Vote on PANX requests               | VALIDATOR                                 |
| `compliance.report`  | Access jurisdiction compliance data | GOVERNMENT                                |
| `admin.revoke`       | Revoke credentials                  | GOVERNMENT                                |

---

## Reference

- [protocol-index.md](protocol-index.md)
- [threat-models.md](../3-engineering/security/threat-models.md)
