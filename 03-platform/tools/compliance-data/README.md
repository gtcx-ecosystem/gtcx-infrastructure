# `@gtcx/compliance-data`

> Cryptographically signed, citable catalog of African fintech regulatory
> jurisdiction data — 11 jurisdictions covering 22+ countries.
> Sourced from central bank circulars, data protection acts, and FATF
> mutual evaluation reports.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## What this is

A single JSON file (`jurisdictions.json`) containing per-jurisdiction:

- KYC and audit retention floors (days)
- Primary regulator + data-protection authority
- Cross-border data flow conditions
- Currency + regulatory notes

The catalog is **Ed25519-signed**. A sidecar `jurisdictions.json.sig`
carries the signature; consumers can verify the catalog hasn't been
tampered with since publication using the embedded public key (no key
server required).

## Why a signed catalog

Anyone can publish a JSON file. What's hard to replicate is a JSON file
a regulator can cite by version + content hash. The signing gives this
catalog the same trust property as the audit chain: tampering breaks
verification, and verification needs no GTCX-side trust — just the
embedded public key and the open-source verifier.

## Installation

```bash
npm install @gtcx/compliance-data
```

## Usage

```js
import data from '@gtcx/compliance-data';

const zw = data.jurisdictions.zimbabwe;
console.log(zw.kyc_retention_days); // 1825 (5 years)
console.log(zw.regulator); // 'RBZ'
```

## Verifying the signature

```bash
# In your project:
node node_modules/@gtcx/compliance-data/03-platform/scripts/verify-catalog.mjs

# Or copy `03-platform/scripts/verify-catalog.mjs` from the package and run:
node verify-catalog.mjs
```

Returns exit 0 on success, non-zero on tampering. The verifier uses
only Node 20+ stdlib (`node:crypto`) — no external deps.

## Coverage

| Region          | Jurisdictions                                        |
| --------------- | ---------------------------------------------------- |
| Southern Africa | zimbabwe, south_africa, botswana, mozambique, zambia |
| East Africa     | kenya, uganda, tanzania, rwanda                      |
| West Africa     | nigeria, ghana                                       |

Each jurisdiction record cites its primary regulator (RBZ, SARB, BoG,
CBN, etc.) and its data protection law (Cyber and Data Protection Act,
POPIA, DPA 2019, NDPA 2023, etc.). Cross-border conditions are sourced
from the respective DPA's published guidance.

## Versioning

This catalog follows [Semantic Versioning](https://semver.org/):

- **PATCH** — typo fixes, source citation updates, no semantic change
- **MINOR** — new jurisdictions added, additive field expansion
- **MAJOR** — field removal, retention period changes, regulator changes
  (i.e. any change a consumer's compliance logic must respond to)

Every published version is signed. The signature covers the canonicalized
JSON; a re-publish without re-signing fails verification.

## Citing this catalog

The repository includes a [`CITATION.cff`](./CITATION.cff) file. For
academic or regulatory citation:

> GTCX Protocol. (2026). _@gtcx/compliance-data: African fintech
> regulatory jurisdiction catalog_ (Version 1.1.0) [Data set].
> https://github.com/gtcx-ecosystem/gtcx-infrastructure/tree/main/03-platform/tools/compliance-data

## Sources + how to contribute

Per-jurisdiction citations live inline in `jurisdictions.json` under
the `notes` field. To propose a change:

1. Update `jurisdictions.json` with the new field/value.
2. Document the source (regulator circular, gazette, FATF report) in
   the commit message.
3. Bump the version per the policy above.
4. Re-sign: `COMPLIANCE_DATA_SIGNING_KEY_B64=... node 03-platform/scripts/sign-catalog.mjs`
5. Open a PR. The verifier test will fail until step 4 completes.

The signing key is held by the GTCX maintainers; community
contributions don't need to sign — maintainers re-sign on merge.

## License

MIT for code (the verifier scripts). The catalog data is dedicated to
the public domain via [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
where the MIT license isn't applicable to facts.
