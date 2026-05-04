# =============================================================================
# GTCX ALB Module — AWS Load Balancer Controller + ACM
# =============================================================================
# Provisions:
#   1. ACM certificate with DNS validation (if domain_name provided)
#   2. IAM role for ALB controller (IRSA)
#   3. AWS Load Balancer Controller via Helm
#
# The controller watches for Ingress resources annotated with
# kubernetes.io/ingress.class: alb and provisions ALBs automatically.
# =============================================================================

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Module      = "alb"
  })

  oidc_issuer = replace(
    replace(var.oidc_provider_arn, "/^arn:aws:iam::\\d+:oidc-provider\\//", ""),
    "/$/", ""
  )
}

# -----------------------------------------------------------------------------
# ACM Certificate (optional — only if domain_name is set)
# -----------------------------------------------------------------------------

resource "aws_acm_certificate" "api" {
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-api-cert"
  })
}

# -----------------------------------------------------------------------------
# IAM Role — ALB Controller (IRSA)
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_iam_role" "alb_controller" {
  name = "gtcx-${var.environment}-alb-controller"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_issuer}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "alb_controller" {
  name = "gtcx-${var.environment}-alb-controller-policy"
  role = aws_iam_role.alb_controller.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeAccountAttributes",
          "ec2:DescribeAddresses",
          "ec2:DescribeAvailabilityZones",
          "ec2:DescribeInternetGateways",
          "ec2:DescribeVpcs",
          "ec2:DescribeVpcPeeringConnections",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeInstances",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeTags",
          "ec2:DescribeCoipPools",
          "ec2:GetCoipPoolUsage",
          "ec2:DescribeTargetGroups",
          "ec2:DescribeTargetHealth",
          "ec2:DescribeListeners",
          "ec2:DescribeRules",
          "elasticloadbalancing:Describe*",
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticloadbalancing:CreateTargetGroup",
          "elasticloadbalancing:DeleteTargetGroup",
          "elasticloadbalancing:CreateListener",
          "elasticloadbalancing:DeleteListener",
          "elasticloadbalancing:CreateRule",
          "elasticloadbalancing:DeleteRule",
          "elasticloadbalancing:ModifyLoadBalancerAttributes",
          "elasticloadbalancing:ModifyTargetGroup",
          "elasticloadbalancing:ModifyTargetGroupAttributes",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:ModifyRule",
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets",
          "elasticloadbalancing:SetWebAcl",
          "elasticloadbalancing:SetSecurityGroups",
          "elasticloadbalancing:SetSubnets",
          "elasticloadbalancing:AddTags",
          "elasticloadbalancing:RemoveTags",
          "iam:CreateServiceLinkedRole",
          "cognito-idp:DescribeUserPoolClient",
          "acm:ListCertificates",
          "acm:DescribeCertificate",
          "waf-regional:GetWebACLForResource",
          "waf-regional:GetWebACL",
          "waf-regional:AssociateWebACL",
          "waf-regional:DisassociateWebACL",
          "wafv2:GetWebACL",
          "wafv2:GetWebACLForResource",
          "wafv2:AssociateWebACL",
          "wafv2:DisassociateWebACL",
          "shield:GetSubscriptionState",
          "shield:DescribeProtection",
          "shield:CreateProtection",
          "shield:DeleteProtection",
          "tag:GetResources",
          "tag:TagResources",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:CreateTags",
          "ec2:DeleteTags",
        ]
        Resource = "*"
      },
    ]
  })
}

# -----------------------------------------------------------------------------
# Helm — AWS Load Balancer Controller
# -----------------------------------------------------------------------------

resource "helm_release" "alb_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = var.chart_version
  namespace  = "kube-system"

  set {
    name  = "clusterName"
    value = var.cluster_name
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.alb_controller.arn
  }

  set {
    name  = "region"
    value = data.aws_region.current.name
  }

  set {
    name  = "vpcId"
    value = var.vpc_id
  }

  # Enforce TLS 1.2+ via default Ingress annotations
  set {
    name  = "defaultTags.Environment"
    value = var.environment
  }
}

# -----------------------------------------------------------------------------
# Default Ingress Class Params — TLS 1.2+ enforcement
# -----------------------------------------------------------------------------
# ALB Ingress annotations must include:
#   alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
#   alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
#   alb.ingress.kubernetes.io/certificate-arn: <from acm_certificate_arn output>
#
# This IngressClassParams resource sets the SSL policy at the class level
# so individual Ingress resources inherit TLS 1.2+ by default.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# WAF v2 — OWASP Core Rule Set
# -----------------------------------------------------------------------------
# Protects ALB-managed load balancers from common web exploits.
# The ALB controller automatically associates this WebACL when Ingress
# resources include: alb.ingress.kubernetes.io/wafv2-acl-arn annotation.
# -----------------------------------------------------------------------------

resource "aws_wafv2_web_acl" "main" {
  name        = "gtcx-${var.environment}-waf"
  description = "GTCX WAF — OWASP Core Rule Set for API protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rules — Core Rule Set (OWASP top 10)
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "gtcx-${var.environment}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules — Known Bad Inputs
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "gtcx-${var.environment}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules — SQL Injection
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "gtcx-${var.environment}-sqli"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting — 2000 requests per 5 minutes per IP
  rule {
    name     = "RateLimitPerIP"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "gtcx-${var.environment}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "gtcx-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

resource "kubectl_manifest" "ingress_class_params" {
  yaml_body = yamlencode({
    apiVersion = "elbv2.k8s.aws/v1beta1"
    kind       = "IngressClassParams"
    metadata = {
      name = "alb-tls"
      labels = {
        "app.kubernetes.io/managed-by" = "terraform"
      }
    }
    spec = {
      scheme = "internet-facing"
      sslPolicy = "ELBSecurityPolicy-TLS13-1-2-2021-06"
      tags = [
        {
          key   = "Environment"
          value = var.environment
        },
        {
          key   = "ManagedBy"
          value = "terraform"
        },
      ]
    }
  })

  depends_on = [helm_release.alb_controller]
}
