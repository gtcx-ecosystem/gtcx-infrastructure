# GTCX Migration Stack - Infrastructure & Orchestration

This directory contains the configurations and scripts for orchestrating the GTCX Migration Stack (MABA, KORA, AMANI).

---

## ⚠️ Important Notice

The source code and functional logic for these components have been migrated to the **[sensei-ai](https://github.com/gtcx-ecosystem/sensei-ai)** repository. This directory is reserved for:

1.  **Orchestration Configs:** Environment-specific YAML definitions.
2.  **Deployment Documentation:** `agile-pm` structures for infrastructure-specific requirements.
3.  **Documentation Tooling:** Audit and template-generation scripts for migration deployment docs.

---

## Components

- **MABA:** Universal Transformation Engine
- **KORA:** Multi-Source Verification Oracle (Part of Sensei-OS)
- **AMANI:** Multilingual Guidance Layer

---

## Quick Start

### Local Tooling

This repository does not currently define standalone `maba`, `kora`, or `amani` Docker Compose services.
Use `sensei-ai` for component runtime development and this repo for deployment-facing documentation and configuration.

To audit the documentation for these components from this directory:

```bash
python 03-platform/scripts/check_docs.py
```

### Configuration

Domain-specific configuration templates live in `config/`. Treat them as deployment-facing templates that may need to be reconciled with the current `sensei-ai` runtime contracts before use.

---

_Part of the GTCX Infrastructure Stack_
