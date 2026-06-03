---
title: 'INF-86 Evidence Archive'
status: current
date: 2026-06-03
---

# INF-86 Evidence Archive

Evidence for the INF-86 sovereign key ceremony (H-02 phase).

## Pre-ceremony (plan only)

| File                                            | Description                                      |
| ----------------------------------------------- | ------------------------------------------------ |
| `sovereign-h02-prevalidation-2026-06-03.txt`    | Terraform plan dry-run output                    |
| `sovereign-h02-prevalidation-2026-06-03.tfplan` | Terraform plan binary (local; may be gitignored) |

Prevalidation alone does **not** satisfy XR-402 or unblock gtcx-protocols [#61](https://github.com/gtcx-ecosystem/gtcx-protocols/issues/61).

## Post-ceremony (after H-02 apply + SPKI export)

| Path                                                | Description                                                |
| --------------------------------------------------- | ---------------------------------------------------------- |
| [`gh-bog-2026-06-03/`](gh-bog-2026-06-03/README.md) | Ceremony log, describe-key, key policy, **SHA-256 of DER** |

**SPKI DER:** export to **`/secure/gh-bog.pub.der`** on the custodian host. **Do not commit** `.der` to git.

Hash for protocols #61:

```bash
shasum -a 256 /secure/gh-bog.pub.der | awk '{print $1}'
```

Post-ceremony index must be listed here before infra marks XR-402 complete on [#61](https://github.com/gtcx-ecosystem/gtcx-protocols/issues/61).
