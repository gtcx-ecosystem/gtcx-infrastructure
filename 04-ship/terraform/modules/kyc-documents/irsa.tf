# =============================================================================
# IRSA — IAM Roles for Service Accounts
# =============================================================================
# Binds a Kubernetes service account to an IAM role via EKS OIDC.
# No static credentials in environment variables — rotation is automatic.
# =============================================================================

data "aws_iam_policy_document" "irsa_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.eks_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${var.eks_oidc_provider_url}:sub"
      values   = ["system:serviceaccount:${var.platform_namespace}:${var.platform_service_account}"]
    }

    condition {
      test     = "StringEquals"
      variable = "${var.eks_oidc_provider_url}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "platform_irsa" {
  name               = "${local.name_prefix}-platform-irsa"
  assume_role_policy = data.aws_iam_policy_document.irsa_trust.json

  tags = merge(var.tags, {
    Name      = "${local.name_prefix}-platform-irsa"
    Component = "kyc-documents"
  })
}

data "aws_iam_policy_document" "kyc_documents_access" {
  # Presigned PUT: generate upload URLs for the kyc/ prefix
  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.kyc_documents.arn}/kyc/*"]
  }

  # Presigned GET: generate download URLs for reviewers
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.kyc_documents.arn}/kyc/*"]
  }

  # List: verify a document exists after upload
  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.kyc_documents.arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["kyc/*"]
    }
  }

  # KMS: decrypt for GetObject, generate data keys for PutObject
  statement {
    effect = "Allow"
    actions = [
      "kms:GenerateDataKey",
      "kms:Decrypt"
    ]
    resources = [aws_kms_key.kyc_documents.arn]
  }
}

resource "aws_iam_policy" "kyc_documents_access" {
  name        = "${local.name_prefix}-kyc-documents-access"
  description = "Allows platform pods to generate presigned URLs and access KYC documents"
  policy      = data.aws_iam_policy_document.kyc_documents_access.json

  tags = merge(var.tags, {
    Component = "kyc-documents"
  })
}

resource "aws_iam_role_policy_attachment" "platform_kyc_documents" {
  role       = aws_iam_role.platform_irsa.name
  policy_arn = aws_iam_policy.kyc_documents_access.arn
}
