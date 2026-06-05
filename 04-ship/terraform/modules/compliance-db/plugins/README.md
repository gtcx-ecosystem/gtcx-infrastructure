# Jurisdiction Plugin Catalog

This directory is the extension point for `terraform-aws-compliance-db`. Each plugin is a self-contained `.tf` file declaring a single jurisdiction's regulatory parameters. The module's `locals.jurisdiction_config` is built from `default.tf` (the current Phase 1 + Phase 2 baselines, lifted from `main.tf` for clarity) merged with every plugin file in this directory.

This separation is intentional. The substrate (encryption, dual-DB pattern, audit retention enforcement, secrets management) lives in `main.tf` and rarely changes. The substrate's _value_ compounds when more jurisdictions are added — but each new jurisdiction is a discrete, reviewable artifact, not a `main.tf` edit.

## Adding a jurisdiction

1. Copy `_template.tf` to a new file named for the jurisdiction (e.g. `morocco.tf`).
2. Fill the parameters. The source for every value is a regulator circular, data-protection act, or FATF mutual-evaluation report; cite it inline in `notes`.
3. Open a PR with the `jurisdiction-plugin` label. A second engineer with regulatory familiarity for that market reviews.
4. CI verifies the plugin parses, the retention values are integers, and the WORM bucket name fits AWS S3 naming rules.

## Phase status

- **Phase 1 (Big 8):** zimbabwe, south_africa, nigeria, egypt, kenya, ghana, tanzania, rwanda.
- **Phase 2 (Regional blocs):** waemu, cemac, generic.
- **Phase 3 (open for plugin contributions):** morocco, tunisia, algeria, mauritius, botswana, senegal, ivory_coast.

Every Phase-3 jurisdiction shipped via the plugin path counts as one tile in the compliance-fabric moat. A competitor cannot retroactively build six months of regulator engagement; we can ship the substrate that captures it.

## Compatibility contract

Existing consumers of the published module pin to `version = "~> 0.1"`. Adding a new jurisdiction is a minor bump; changing an existing jurisdiction's retention floor is a major bump (the WORM Object Lock retention window cannot be lowered after the fact).

## Verification

Each plugin must pass:

- `terraform fmt -check`
- `terraform validate` against the parent module
- The compliance-db `.tftest.hcl` suite

The CI gate that runs these lives in `.github/workflows/ci.yml` and blocks merges that fail.
