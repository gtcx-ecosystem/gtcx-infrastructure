# Operations

Production runbooks, release process, compliance controls, and incident response for the GTCX Protocol layer.

## Contents

| Document                                                                             | Description                                                                             |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [runbooks/production-store-integration.md](runbooks/production-store-integration.md) | Wire Redis and Postgres for production — rate limiting, audit persistence, replay cache |
| [runbooks/disaster-recovery.md](runbooks/disaster-recovery.md)                       | RTO/RPO targets, recovery procedure, validation steps                                   |
| [runbooks/release.md](runbooks/release.md)                                           | Pre-flight validation, release tagging, rollback decisions                              |
| [compliance/controls-matrix.md](compliance/controls-matrix.md)                       | NIST 800-53 / SOC 2 / ISO 27001 control mapping and implementation status               |
| [compliance/regulatory-framework.md](compliance/regulatory-framework.md)             | Regulatory landscape, per-commodity framework mapping, GCI alignment                    |

## What Belongs Here

- Production deployment runbooks
- Release process and rollback procedures
- Disaster recovery procedures
- Compliance control mappings and certification evidence
- Regulatory framework documentation

## What Does NOT Belong Here

- Development setup → `../3-engineering/dev-setup.md`
- Security threat models → `../3-engineering/security/`
- Protocol specifications → `../2-specs/`
