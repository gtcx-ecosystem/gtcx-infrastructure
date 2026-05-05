# =============================================================================
# ML Pipeline Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates S3 buckets, DynamoDB table, and IRSA configuration.
# =============================================================================

variables {
  environment           = "test"
  region                = "af-south-1"
  dataset_bucket_name   = "gtcx-test-intelligence-datasets"
  model_bucket_name     = "gtcx-test-intelligence-models"
  registry_table_name   = "test-intelligence-model-registry"
  eks_oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/TEST"
  eks_oidc_provider_url = "oidc.eks.af-south-1.amazonaws.com/id/TEST"
  pipeline_namespace    = "intelligence"
  pipeline_service_account = "intelligence-pipeline"
}

# -----------------------------------------------------------------------------
# Dataset S3 Bucket
# -----------------------------------------------------------------------------

run "dataset_bucket_has_versioning" {
  command = plan

  assert {
    condition     = aws_s3_bucket_versioning.datasets.versioning_configuration[0].status == "Enabled"
    error_message = "Dataset bucket must have versioning enabled for DVC"
  }
}

run "dataset_bucket_has_kms_encryption" {
  command = plan

  assert {
    condition     = aws_s3_bucket_server_side_encryption_configuration.datasets.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm == "aws:kms"
    error_message = "Dataset bucket must use KMS encryption"
  }
}

run "dataset_bucket_blocks_public_access" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.datasets.block_public_acls == true
    error_message = "Dataset bucket must block all public access"
  }
}

run "dataset_bucket_has_glacier_lifecycle" {
  command = plan

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.datasets.rule[0].transition[0].storage_class == "GLACIER_IR"
    error_message = "Dataset bucket must transition old versions to Glacier IR"
  }
}

# -----------------------------------------------------------------------------
# Model S3 Bucket
# -----------------------------------------------------------------------------

run "model_bucket_has_versioning" {
  command = plan

  assert {
    condition     = aws_s3_bucket_versioning.models.versioning_configuration[0].status == "Enabled"
    error_message = "Model bucket must have versioning enabled"
  }
}

run "model_bucket_has_kms_encryption" {
  command = plan

  assert {
    condition     = aws_s3_bucket_server_side_encryption_configuration.models.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm == "aws:kms"
    error_message = "Model bucket must use KMS encryption"
  }
}

run "model_bucket_blocks_public_access" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.models.block_public_acls == true
    error_message = "Model bucket must block all public access"
  }
}

# -----------------------------------------------------------------------------
# DynamoDB Model Registry
# -----------------------------------------------------------------------------

run "registry_uses_pay_per_request" {
  command = plan

  assert {
    condition     = aws_dynamodb_table.model_registry.billing_mode == "PAY_PER_REQUEST"
    error_message = "Model registry must use PAY_PER_REQUEST billing"
  }
}

run "registry_has_pitr" {
  command = plan

  assert {
    condition     = aws_dynamodb_table.model_registry.point_in_time_recovery[0].enabled == true
    error_message = "Model registry must have point-in-time recovery enabled"
  }
}

run "registry_has_status_index" {
  command = plan

  assert {
    condition     = length(aws_dynamodb_table.model_registry.global_secondary_index) > 0
    error_message = "Model registry must have a status GSI for querying by model status"
  }
}

# -----------------------------------------------------------------------------
# IRSA
# -----------------------------------------------------------------------------

run "irsa_role_name_includes_environment" {
  command = plan

  assert {
    condition     = aws_iam_role.pipeline.name == "gtcx-test-intelligence-pipeline"
    error_message = "IRSA role name must include environment"
  }
}

run "irsa_role_has_s3_and_dynamodb_policies" {
  command = plan

  assert {
    condition     = aws_iam_role_policy.pipeline_s3.name == "gtcx-test-pipeline-s3"
    error_message = "Pipeline role must have S3 policy attached"
  }
}
