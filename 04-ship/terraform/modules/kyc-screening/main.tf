# =============================================================================
# KYC Screening Lambda — Ambient AI-Native Processing
# =============================================================================
# Triggered by S3 ObjectCreated events on the kyc-documents bucket.
# Runs background screening (deterministic mock or comply-advantage)
# and writes a sibling <key>.screening.json with the verdict.
#
# Wiring the S3 event notification onto the existing kyc-documents
# bucket is INTENTIONALLY a separate operator step — flipping a
# production bucket's event configuration is a deliberate change that
# benefits from explicit review. See outputs.lambda_arn for the
# subscription target.
#
# Principle: AI-NATIVE Pattern #1 (Ambient Intelligence) — the LLM-
# driven screening runs as documents arrive; when the operator opens
# the document UI, the result is already there.
# =============================================================================

variable "environment" {
  description = "Environment name (testnet, staging, production)"
  type        = string
}

variable "kyc_documents_bucket_arn" {
  description = "ARN of the KYC documents bucket the Lambda reads from + writes results to"
  type        = string
}

variable "kyc_documents_kms_key_arn" {
  description = "ARN of the KMS key encrypting the KYC documents bucket"
  type        = string
}

variable "lambda_package_path" {
  description = "Path to the Lambda deployment .zip produced by tools/scripts/package-lambda.sh"
  type        = string
  default     = "../../../../tools/kyc-screening/dist/kyc-screening.zip"
}

variable "screening_provider" {
  description = "Provider selector: 'local' (deterministic mock) or 'comply-advantage' (requires COMPLY_ADVANTAGE_API_KEY in env)"
  type        = string
  default     = "local"

  validation {
    condition     = contains(["local", "comply-advantage"], var.screening_provider)
    error_message = "screening_provider must be 'local' or 'comply-advantage'"
  }
}

variable "comply_advantage_api_key_secret_arn" {
  description = "Secrets Manager ARN holding the ComplyAdvantage API key; required when screening_provider = comply-advantage"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

locals {
  name_prefix = "gtcx-${var.environment}-kyc-screening"
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Component   = "kyc-screening"
    Principle   = "AI-NATIVE"
  })
}

# -----------------------------------------------------------------------------
# Dead-letter queue — captures failed invocations for forensic review
# -----------------------------------------------------------------------------

resource "aws_sqs_queue" "dlq" {
  name                       = "${local.name_prefix}-dlq"
  message_retention_seconds  = 14 * 24 * 3600 # 14 days
  visibility_timeout_seconds = 300

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# IAM — least privilege: read kyc docs, write screening sidecars,
#                        decrypt with the bucket CMK, send to DLQ
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRoleWithWebIdentity"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "screening_access" {
  name = "${local.name_prefix}-access"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat([
      {
        Sid    = "ReadKycDocs"
        Effect = "Allow"
        Action = ["s3:GetObject"]
        # Restrict to the kyc/ prefix so the Lambda cannot read its
        # own screening sidecars (.screening.json) or unrelated keys.
        Resource = "${var.kyc_documents_bucket_arn}/kyc/*"
      },
      {
        Sid      = "WriteScreeningResults"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:PutObjectAcl"]
        Resource = "${var.kyc_documents_bucket_arn}/kyc/*.screening.json"
      },
      {
        Sid    = "DecryptKycDocs"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
        ]
        Resource = var.kyc_documents_kms_key_arn
      },
      {
        Sid      = "SendToDlq"
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = aws_sqs_queue.dlq.arn
      },
      ], var.screening_provider == "comply-advantage" ? [
      {
        Sid      = "ReadComplyAdvantageKey"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = var.comply_advantage_api_key_secret_arn
      }
    ] : [])
  })
}

# -----------------------------------------------------------------------------
# Lambda function
# -----------------------------------------------------------------------------

resource "aws_lambda_function" "screening" {
  function_name = local.name_prefix
  role          = aws_iam_role.lambda.arn
  handler       = "src/handler.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 512

  filename         = var.lambda_package_path
  source_code_hash = filebase64sha256(var.lambda_package_path)

  reserved_concurrent_executions = 50

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  environment {
    variables = merge({
      SCREENING_PROVIDER = var.screening_provider
      }, var.screening_provider == "comply-advantage" ? {
      COMPLY_ADVANTAGE_API_KEY_SECRET_ARN = var.comply_advantage_api_key_secret_arn
    } : {})
  }

  tracing_config {
    mode = "Active"
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Allow the kyc-documents bucket to invoke the Lambda
# -----------------------------------------------------------------------------
# The bucket's event-notification config lives in the kyc-documents
# module; the operator wires it after this module applies, against
# `aws_lambda_function.screening.arn`.

resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.screening.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.kyc_documents_bucket_arn
}
