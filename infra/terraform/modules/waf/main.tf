# =============================================================================
# AWS WAFv2 Web ACL with OWASP Core Rule Set
# =============================================================================
# Production-grade WAF for gtcx production ingress.
# Rules: AWSManagedRulesCommonRuleSet (OWASP Top 10), RateLimiting, BotControl
#
# ARN referenced by: infra/kubernetes/overlays/production/ingress.yaml
# =============================================================================

variable "name_prefix" {
  description = "Prefix for all WAF resources"
  type        = string
  default     = "gtcx"
}

variable "scope" {
  description = "WAF scope: REGIONAL or CLOUDFRONT"
  type        = string
  default     = "REGIONAL"
}

variable "rate_limit" {
  description = "Requests per 5 minutes per IP"
  type        = number
  default     = 2000
}

variable "aws_region" {
  description = "AWS region for WAF deployment"
  type        = string
  default     = "af-south-1"
}

resource "aws_wafv2_web_acl" "main" {
  name        = "${var.name_prefix}-waf-${var.aws_region}"
  description = "OWASP CRS + BotControl + RateLimit for ${var.name_prefix}"
  scope       = var.scope

  default_action {
    allow {}
  }

  # AWS Managed Rule: OWASP Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
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
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule: Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
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
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate Limiting — per IP
  rule {
    name     = "RateLimitPerIP"
    priority = 3
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitPerIPMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule: Bot Control (optional, lower priority)
  rule {
    name     = "AWSManagedRulesBotControlRuleSet"
    priority = 4
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"
        rule_action_override {
          action_to_use {
            count {}
          }
          name = "SignalNonBrowserUserAgent"
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesBotControlRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name      = "${var.name_prefix}-waf"
    ManagedBy = "terraform"
    Purpose   = "institutional-controls-phase3"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}-waf-metric"
    sampled_requests_enabled   = true
  }
}

output "web_acl_arn" {
  description = "ARN of the WAF WebACL for ALB/ingress association"
  value       = aws_wafv2_web_acl.main.arn
}

output "web_acl_id" {
  description = "ID of the WAF WebACL"
  value       = aws_wafv2_web_acl.main.id
}
