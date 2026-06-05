# =============================================================================
# CI/CD Module — GitHub Actions OIDC + Deploy Role
# =============================================================================
# Creates the GitHub OIDC identity provider and a deploy IAM role that
# GitHub Actions assumes via OIDC (no long-lived credentials needed).
#
# Supports two modes:
#   1. Per-repo role (default): One role scoped to a single repository
#   2. Shared org role: One role any repo in the org can assume (set repository_pattern)
#
# Usage in GitHub Actions:
#   uses: aws-actions/configure-aws-credentials@v4
#   with:
#     role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
#     aws-region: af-south-1
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "github_org" {
  description = "GitHub organization name"
  type        = string
  default     = "gtcx-ecosystem"
}

variable "github_repo" {
  description = "GitHub repository name (without org prefix). Used when repository_pattern is not set."
  type        = string
  default     = ""
}

variable "repository_pattern" {
  description = "OIDC subject pattern for repo trust. Overrides github_repo when set. Use 'repo:gtcx-ecosystem/*:ref:refs/heads/main' for shared org role."
  type        = string
  default     = ""
}

variable "create_oidc_provider" {
  description = "Create the GitHub OIDC provider. Set false in additional environments within the same AWS account."
  type        = bool
  default     = true
}

variable "ecr_repository_arns" {
  description = "ECR repository ARNs the deploy role can push to"
  type        = list(string)
  default     = []
}

variable "enable_broad_ecr_access" {
  description = "Allow push to ALL ECR repositories in the account (use with shared org role)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# GitHub OIDC Provider
# -----------------------------------------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_oidc_provider ? 1 : 0

  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub's OIDC thumbprint (stable, published by GitHub)
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = merge(var.tags, {
    Name = "github-actions-oidc"
  })
}

# Look up existing OIDC provider when not creating
locals {
  github_oidc_provider_arn = var.create_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

# -----------------------------------------------------------------------------
# Deploy IAM Role (assumed by GitHub Actions via OIDC)
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

locals {
  # Build the OIDC subject pattern
  oidc_subject_pattern = var.repository_pattern != "" ? var.repository_pattern : "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"
}

resource "aws_iam_role" "github_deploy" {
  name = "gtcx-${var.environment}-shared-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = local.github_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          # Shared org role: any repo in gtcx-ecosystem can deploy from main
          "token.actions.githubusercontent.com:sub" = local.oidc_subject_pattern
        }
      }
    }]
  })

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Deploy Role Policy — ECR push + EKS describe
# -----------------------------------------------------------------------------

resource "aws_iam_role_policy" "github_deploy" {
  name = "gtcx-${var.environment}-github-deploy-policy"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          # ECR authentication (not repo-specific)
          Sid      = "ECRAuth"
          Effect   = "Allow"
          Action   = ["ecr:GetAuthorizationToken"]
          Resource = "*"
        },
        {
          # EKS — describe cluster for kubeconfig (read-only)
          Sid    = "EKSDescribe"
          Effect = "Allow"
          Action = [
            "eks:DescribeCluster",
            "eks:ListClusters",
          ]
          Resource = "arn:aws:eks:*:${data.aws_caller_identity.current.account_id}:cluster/gtcx-*"
        },
        {
          # CloudWatch Logs for service deployments
          Sid    = "CloudWatchLogs"
          Effect = "Allow"
          Action = [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
          ]
          Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/eks/gtcx-*"
        },
      ],
      # Conditionally add ECR push permissions
      length(var.ecr_repository_arns) > 0 ? [{
        Sid    = "ECRPush"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:DescribeRepositories",
          "ecr:DescribeImages",
          "ecr:ListImages",
        ]
        Resource = var.ecr_repository_arns
      }] : [],
      # Broad ECR access for shared org role
      var.enable_broad_ecr_access ? [{
        Sid    = "ECRPushAll"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:DescribeRepositories",
          "ecr:DescribeImages",
          "ecr:ListImages",
        ]
        Resource = "arn:aws:ecr:*:${data.aws_caller_identity.current.account_id}:repository/gtcx-*"
      }] : []
    )
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "deploy_role_arn" {
  description = "IAM role ARN for GitHub Actions to assume"
  value       = aws_iam_role.github_deploy.arn
}

output "github_oidc_provider_arn" {
  description = "GitHub OIDC provider ARN"
  value       = local.github_oidc_provider_arn
}
