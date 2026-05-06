# =============================================================================
# GTCX Workflow Orchestration Module — Main
# =============================================================================
# Argo Workflows for durable pipeline orchestration. Runs the L5 cycle:
# curate dataset → fine-tune → evaluate → red-team scan → promote/reject
#
# Per SIGNAL L5: Automated, observable, auditable improvement cycles
# Per SOVEREIGN (6): Runs in-region alongside compute and data
# =============================================================================

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Component   = "workflow-orchestration"
    Principle   = "SIGNAL-L5"
  })

  oidc_issuer            = var.eks_oidc_provider_url
  workflow_enabled       = var.enable_fine_tune_workflow
  trainer_enabled        = trimspace(var.trainer_image) != ""
  red_team_enabled       = var.enable_red_team_workflow && trimspace(var.red_team_image) != ""
  evidence_manifest_path = trimspace(var.enablement_evidence_manifest) != "" ? "${path.root}/${trimspace(var.enablement_evidence_manifest)}" : ""
  evidence_manifest      = local.workflow_enabled && local.evidence_manifest_path != "" && fileexists(local.evidence_manifest_path) ? jsondecode(file(local.evidence_manifest_path)) : null

  fine_tune_steps = concat(
    [
      [{ name = "curate-dataset", template = "curate" }],
    ],
    local.trainer_enabled ? [[{ name = "fine-tune", template = "train" }]] : [],
    [
      [{ name = "evaluate", template = "eval" }],
    ],
    local.red_team_enabled ? [[{ name = "red-team", template = "red-team-scan" }]] : [],
    [
      [{ name = "promote-or-reject", template = "promotion-gate" }],
    ]
  )

  fine_tune_templates = concat(
    [
      {
        name = "curate"
        container = {
          image   = var.curator_image
          command = ["node", "dist/learning/curator.js"]
          args    = ["--dataset-version", "{{workflow.parameters.dataset-version}}"]
        }
      },
    ],
    local.trainer_enabled ? [{
      name = "train"
      nodeSelector = {
        "nvidia.com/gpu.present" = "true"
      }
      tolerations = [{
        key      = "nvidia.com/gpu"
        operator = "Exists"
        effect   = "NoSchedule"
      }]
      container = {
        image   = var.trainer_image
        command = ["python", "fine_tune.py"]
        resources = {
          limits = {
            "nvidia.com/gpu" = "1"
            memory           = "16Gi"
          }
          requests = {
            "nvidia.com/gpu" = "1"
            memory           = "8Gi"
          }
        }
      }
    }] : [],
    [
      {
        name = "eval"
        container = {
          image   = var.evaluator_image
          command = ["node", "dist/learning/eval.js"]
          args    = ["--threshold", "{{workflow.parameters.eval-threshold}}"]
        }
      },
    ],
    local.red_team_enabled ? [{
      name = "red-team-scan"
      container = {
        image   = var.red_team_image
        command = ["python", "-m", "garak", "--model-type", "local"]
      }
    }] : [],
    [
      {
        name = "promotion-gate"
        container = {
          image   = var.promoter_image
          command = ["node", "dist/learning/promoter.js"]
          args    = ["--model-id", "{{workflow.parameters.model-id}}"]
        }
      },
    ]
  )
}

resource "terraform_data" "workflow_policy_guard" {
  input = {
    environment = var.environment
  }

  lifecycle {
    precondition {
      condition     = !local.workflow_enabled || trimspace(var.enablement_evidence_manifest) != ""
      error_message = "enable_fine_tune_workflow=true requires enablement_evidence_manifest to be set."
    }

    precondition {
      condition     = !local.workflow_enabled || fileexists(local.evidence_manifest_path)
      error_message = "enable_fine_tune_workflow=true requires an evidence manifest file that exists relative to the environment root module."
    }

    precondition {
      condition     = !local.workflow_enabled || trimspace(var.curator_image) != ""
      error_message = "enable_fine_tune_workflow=true requires curator_image to be set."
    }

    precondition {
      condition     = !local.workflow_enabled || trimspace(var.trainer_image) != ""
      error_message = "enable_fine_tune_workflow=true requires trainer_image to be set."
    }

    precondition {
      condition     = !local.workflow_enabled || trimspace(var.evaluator_image) != ""
      error_message = "enable_fine_tune_workflow=true requires evaluator_image to be set."
    }

    precondition {
      condition     = !local.workflow_enabled || trimspace(var.promoter_image) != ""
      error_message = "enable_fine_tune_workflow=true requires promoter_image to be set."
    }

    precondition {
      condition     = !var.enable_red_team_workflow || local.workflow_enabled
      error_message = "enable_red_team_workflow=true requires enable_fine_tune_workflow=true."
    }

    precondition {
      condition     = !var.enable_red_team_workflow || trimspace(var.red_team_image) != ""
      error_message = "enable_red_team_workflow=true requires red_team_image to be set."
    }

    precondition {
      condition     = !local.workflow_enabled || try(local.evidence_manifest.environment, "") == var.environment
      error_message = "Evidence manifest environment must match the Terraform environment."
    }

    precondition {
      condition     = !local.workflow_enabled || try(local.evidence_manifest.checks.trainer_artifact.status, "") == "verified"
      error_message = "Evidence manifest must mark checks.trainer_artifact.status as verified before enabling the workflow."
    }

    precondition {
      condition     = !local.workflow_enabled || try(local.evidence_manifest.checks.eval_gate.status, "") == "verified"
      error_message = "Evidence manifest must mark checks.eval_gate.status as verified before enabling the workflow."
    }

    precondition {
      condition     = !local.workflow_enabled || try(local.evidence_manifest.checks.promotion_target.status, "") == "verified"
      error_message = "Evidence manifest must mark checks.promotion_target.status as verified before enabling the workflow."
    }

    precondition {
      condition     = !local.workflow_enabled || try(local.evidence_manifest.checks.staging_e2e.status, "") == "verified"
      error_message = "Evidence manifest must mark checks.staging_e2e.status as verified before enabling the workflow."
    }
  }
}

# -----------------------------------------------------------------------------
# Helm Release — Argo Workflows
# -----------------------------------------------------------------------------

resource "helm_release" "argo_workflows" {
  name             = "argo-workflows"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-workflows"
  version          = var.chart_version
  namespace        = var.namespace
  create_namespace = true

  wait    = true
  timeout = 600

  set {
    name  = "server.serviceType"
    value = "ClusterIP"
  }

  set {
    name  = "controller.workflowNamespaces"
    value = "{${var.namespace}}"
  }

  set {
    name  = "controller.persistence.archive"
    value = "false"
  }

  set {
    name  = "controller.metricsConfig.enabled"
    value = "true"
  }

  set {
    name  = "workflow.serviceAccount.create"
    value = "false"
  }
}

# -----------------------------------------------------------------------------
# IAM — IRSA Role for Workflow Service Account
# -----------------------------------------------------------------------------
# Pipeline workflows need access to: S3 (datasets + models), DynamoDB
# (registry), SQS (trace events), ECR (pull images).

resource "aws_iam_role" "workflow" {
  name = "gtcx-${var.environment}-intelligence-workflow"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.eks_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.namespace}:${var.workflow_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "workflow_s3" {
  name = "gtcx-${var.environment}-workflow-s3"
  role = aws_iam_role.workflow.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DatasetAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject",
        ]
        Resource = [
          var.dataset_bucket_arn,
          "${var.dataset_bucket_arn}/*",
        ]
      },
      {
        Sid    = "ModelAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
        ]
        Resource = [
          var.model_bucket_arn,
          "${var.model_bucket_arn}/*",
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy" "workflow_dynamodb" {
  name = "gtcx-${var.environment}-workflow-dynamodb"
  role = aws_iam_role.workflow.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "ModelRegistry"
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
      ]
      Resource = [
        var.registry_table_arn,
        "${var.registry_table_arn}/index/*",
      ]
    }]
  })
}

resource "aws_iam_role_policy" "workflow_sqs" {
  name = "gtcx-${var.environment}-workflow-sqs"
  role = aws_iam_role.workflow.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "TraceEvents"
      Effect = "Allow"
      Action = [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
      ]
      Resource = var.trace_queue_arn
    }]
  })
}

resource "aws_iam_role_policy" "workflow_ecr" {
  count = length(var.ecr_repository_arns) > 0 ? 1 : 0

  name = "gtcx-${var.environment}-workflow-ecr"
  role = aws_iam_role.workflow.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "ECRPull"
      Effect = "Allow"
      Action = [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
      ]
      Resource = var.ecr_repository_arns
    }]
  })
}

# -----------------------------------------------------------------------------
# K8s Service Account (annotated with IRSA)
# -----------------------------------------------------------------------------

resource "kubernetes_service_account" "workflow" {
  metadata {
    name      = var.workflow_service_account
    namespace = var.namespace

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.workflow.arn
    }

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = "gtcx-intelligence"
      "app.kubernetes.io/component"  = "ml-pipeline"
    }
  }

  depends_on = [helm_release.argo_workflows]
}

# -----------------------------------------------------------------------------
# K8s — Fine-Tune Workflow Template
# -----------------------------------------------------------------------------

resource "kubectl_manifest" "fine_tune_workflow_template" {
  count = local.workflow_enabled ? 1 : 0

  yaml_body = yamlencode({
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "WorkflowTemplate"
    metadata = {
      name      = "intelligence-fine-tune-cycle"
      namespace = var.namespace
    }
    spec = {
      entrypoint         = "fine-tune-pipeline"
      serviceAccountName = var.workflow_service_account
      arguments = {
        parameters = [
          { name = "model-id", value = var.fine_tune_model_id },
          { name = "dataset-version", value = "latest" },
          { name = "eval-threshold", value = var.eval_threshold },
        ]
      }
      templates = concat(
        [{
          name  = "fine-tune-pipeline"
          steps = local.fine_tune_steps
        }],
        local.fine_tune_templates
      )
    }
  })

  depends_on = [helm_release.argo_workflows]
}

# -----------------------------------------------------------------------------
# K8s — CronWorkflow (Bi-Weekly Fine-Tune Cycle)
# -----------------------------------------------------------------------------

resource "kubectl_manifest" "fine_tune_cron" {
  count = local.workflow_enabled ? 1 : 0

  yaml_body = yamlencode({
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "CronWorkflow"
    metadata = {
      name      = "intelligence-fine-tune-biweekly"
      namespace = var.namespace
    }
    spec = {
      schedule = var.fine_tune_schedule
      timezone = var.fine_tune_timezone
      workflowSpec = {
        workflowTemplateRef = {
          name = "intelligence-fine-tune-cycle"
        }
        arguments = {
          parameters = [
            { name = "model-id", value = var.fine_tune_model_id },
            { name = "dataset-version", value = "latest" },
          ]
        }
      }
    }
  })

  depends_on = [kubectl_manifest.fine_tune_workflow_template]
}
