# =============================================================================
# Workflow Orchestration Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates Helm release, IRSA, and pipeline IAM policies.
# =============================================================================

variables {
  environment           = "test"
  namespace             = "argo-workflows"
  chart_version         = "0.41.14"
  eks_oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/TEST"
  eks_oidc_provider_url = "oidc.eks.af-south-1.amazonaws.com/id/TEST"
  dataset_bucket_arn    = "arn:aws:s3:::gtcx-test-intelligence-datasets"
  model_bucket_arn      = "arn:aws:s3:::gtcx-test-intelligence-models"
  registry_table_arn    = "arn:aws:dynamodb:af-south-1:123456789012:table/test-intelligence-model-registry"
  trace_queue_arn       = "arn:aws:sqs:af-south-1:123456789012:test-intelligence-trace-events"
  fine_tune_schedule    = "0 2 1,15 * *"
  fine_tune_timezone    = "Africa/Johannesburg"
  fine_tune_model_id    = "cortex-anomaly-detector"
  eval_threshold        = "0.05"
  enablement_evidence_manifest = "testdata/enablement-evidence.test.json"
  enable_fine_tune_workflow = true
  enable_red_team_workflow = false
  curator_image         = "placeholder/gtcx-intelligence-curator:sha-contract"
  trainer_image         = "placeholder/gtcx-intelligence-trainer:sha-contract"
  evaluator_image       = "placeholder/gtcx-intelligence-evaluator:sha-contract"
  promoter_image        = "placeholder/gtcx-intelligence-promoter:sha-contract"
}

# -----------------------------------------------------------------------------
# Helm Release
# -----------------------------------------------------------------------------

run "argo_deploys_to_correct_namespace" {
  command = plan

  assert {
    condition     = helm_release.argo_workflows.namespace == "argo-workflows"
    error_message = "Argo Workflows must deploy to argo-workflows namespace"
  }
}

run "argo_uses_correct_chart" {
  command = plan

  assert {
    condition     = helm_release.argo_workflows.chart == "argo-workflows"
    error_message = "Must use the official argo-workflows Helm chart"
  }
}

# -----------------------------------------------------------------------------
# IRSA
# -----------------------------------------------------------------------------

run "workflow_role_name_includes_environment" {
  command = plan

  assert {
    condition     = aws_iam_role.workflow.name == "gtcx-test-intelligence-workflow"
    error_message = "Workflow IRSA role must include environment name"
  }
}

run "workflow_has_s3_policy" {
  command = plan

  assert {
    condition     = aws_iam_role_policy.workflow_s3.name == "gtcx-test-workflow-s3"
    error_message = "Workflow role must have S3 access policy"
  }
}

run "workflow_has_dynamodb_policy" {
  command = plan

  assert {
    condition     = aws_iam_role_policy.workflow_dynamodb.name == "gtcx-test-workflow-dynamodb"
    error_message = "Workflow role must have DynamoDB access policy"
  }
}

run "workflow_has_sqs_policy" {
  command = plan

  assert {
    condition     = aws_iam_role_policy.workflow_sqs.name == "gtcx-test-workflow-sqs"
    error_message = "Workflow role must have SQS access policy"
  }
}
