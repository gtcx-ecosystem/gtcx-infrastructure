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

  oidc_issuer = var.eks_oidc_provider_url
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
    value = "true"
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
      templates = [
        {
          name = "fine-tune-pipeline"
          steps = [
            [{ name = "curate-dataset", template = "curate" }],
            [{ name = "fine-tune", template = "train" }],
            [{ name = "evaluate", template = "eval" }],
            [{ name = "red-team", template = "red-team-scan" }],
            [{ name = "promote-or-reject", template = "promotion-gate" }],
          ]
        },
        {
          name = "curate"
          container = {
            image   = "placeholder/gtcx-intelligence-sdk:latest"
            command = ["node", "dist/learning/curator.js"]
            args    = ["--dataset-version", "{{workflow.parameters.dataset-version}}"]
          }
        },
        {
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
            image   = "placeholder/gtcx-intelligence-sdk:latest"
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
        },
        {
          name = "eval"
          container = {
            image   = "placeholder/gtcx-intelligence-sdk:latest"
            command = ["node", "dist/learning/eval.js"]
            args    = ["--threshold", "{{workflow.parameters.eval-threshold}}"]
          }
        },
        {
          name = "red-team-scan"
          container = {
            image   = "placeholder/gtcx-intelligence-red-team:latest"
            command = ["python", "-m", "garak", "--model-type", "local"]
          }
        },
        {
          name = "promotion-gate"
          container = {
            image   = "placeholder/gtcx-intelligence-sdk:latest"
            command = ["node", "dist/learning/promoter.js"]
            args    = ["--model-id", "{{workflow.parameters.model-id}}"]
          }
        },
      ]
    }
  })

  depends_on = [helm_release.argo_workflows]
}

# -----------------------------------------------------------------------------
# K8s — CronWorkflow (Bi-Weekly Fine-Tune Cycle)
# -----------------------------------------------------------------------------

resource "kubectl_manifest" "fine_tune_cron" {
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
