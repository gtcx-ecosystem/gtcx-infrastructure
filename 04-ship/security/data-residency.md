# Data Residency Architecture

**NIST Control:** SC-28, PM-11
**SOC 2:** CC6.1
**ISO 27001:** A.8.24, A.18.1

---

## Overview

GTCX supports multi-region deployment to meet data residency requirements. All protocol data (identities, credentials, custody records, compliance scores, audit logs) can be isolated to a specific geographic region.

---

## Deployment Regions

| Region             | AWS Region | Use Case                        |
| ------------------ | ---------- | ------------------------------- |
| US East            | us-east-1  | Default for US-based customers  |
| EU West            | eu-west-1  | GDPR-compliant for EU customers |
| Africa (Cape Town) | af-south-1 | Sub-Saharan Africa deployments  |

Each region runs an independent stack:

- Dedicated PostgreSQL instances (operational + audit)
- Dedicated Redis cache
- Dedicated protocol server deployment
- Region-specific KMS keys

---

## Data Isolation Guarantees

### What stays in-region

| Data Type                                | Storage                     | Region-Locked |
| ---------------------------------------- | --------------------------- | ------------- |
| TradePass identities (DIDs, credentials) | PostgreSQL                  | Yes           |
| GeoTag location claims                   | PostgreSQL                  | Yes           |
| VaultMark custody records                | PostgreSQL                  | Yes           |
| GCI compliance scores                    | PostgreSQL                  | Yes           |
| PvP settlement records                   | PostgreSQL                  | Yes           |
| Audit log entries                        | PostgreSQL (audit DB)       | Yes           |
| Backup exports                           | S3 (region-specific bucket) | Yes           |
| Cache data (rate limits, replay)         | Redis                       | Yes           |

### What may cross regions

| Data Type                 | Reason                                                       | Mitigation                                                       |
| ------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| PANX consensus messages   | Multi-stakeholder oracle requires cross-region communication | Envelope signing ensures integrity; no PII in consensus messages |
| SBOM and container images | Published to global container registry                       | No customer data in images                                       |
| Monitoring metrics        | Aggregated in central Grafana                                | Metrics contain no PII — only counters and latencies             |

---

## Terraform Configuration

Each region is an independent Terraform environment:

```
04-ship/terraform/environments/
├── template/          # Base environment template
├── us-east-1/         # US region
├── eu-west-1/         # EU region
└── af-south-1/        # Africa region
```

Region-specific variables:

```hcl
variable "region" {
  description = "AWS region for all resources"
  type        = string
}

variable "data_residency" {
  description = "Data residency label for compliance tagging"
  type        = string  # "US", "EU", "AF"
}
```

All resources tagged with `DataResidency` label for audit trail.

---

## Customer Configuration

Customers specify their data residency region at onboarding. The SDK `GTCXClient.fromNetwork()` routes to the correct regional endpoint:

```typescript
// Routes to EU region
const client = GTCXClient.fromNetwork('eu', { apiKey: '...' });

// Routes to Africa region
const client = GTCXClient.fromNetwork('ghana', { apiKey: '...' });
```

The protocol server at each regional endpoint only accesses databases within that region.

---

## Compliance Mapping

| Regulation                     | Requirement                                                   | Implementation                          |
| ------------------------------ | ------------------------------------------------------------- | --------------------------------------- |
| GDPR Art. 44-49                | Data transfers outside EU require adequacy decision or SCCs   | EU region keeps all data in eu-west-1   |
| Ghana Data Protection Act 2012 | Personal data processed in Ghana or with adequate protections | Africa region in af-south-1 (Cape Town) |
| US state privacy laws          | Varies by state; no federal mandate                           | US region in us-east-1                  |

---

**Document Status:** Active
**Review Cycle:** Quarterly
**Owner:** Infrastructure + Compliance
