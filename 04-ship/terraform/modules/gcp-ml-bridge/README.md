# gcp-ml-bridge

GCP Workload Identity Federation → AWS IAM role for **intelligence Phase 3** Vertex pipelines.

Writes **model artifacts only** to existing `ml-pipeline` S3/DynamoDB resources. Does not provision GCP resources (Vertex/GCS/BQ are owned by gtcx-intelligence).

**Epic:** `01-docs/04-ops/intelligence-phase-3-gcp-ml-bridge-epic-2026-06-05.md`

**Enable when:**

1. GCP project + `intelligence-ml` service account exist
2. `gcp_service_account_unique_id` is known
3. `ml-pipeline` module is already applied in the target environment

```hcl
module "gcp_ml_bridge" {
  source = "../../modules/gcp-ml-bridge"

  environment                   = var.environment
  enabled                       = true
  gcp_service_account_unique_id = "<from GCP>"
  model_bucket_arn              = module.ml_pipeline.model_bucket_arn
  registry_table_arn            = module.ml_pipeline.registry_table_arn
  tags                          = var.tags
}
```
