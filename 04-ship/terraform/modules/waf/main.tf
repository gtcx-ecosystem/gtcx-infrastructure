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

variable "allow_health_path" {
  description = "Allow GET/HEAD /health without Bot Control blocking (uptime monitors, bare curl)"
  type        = bool
  default     = true
}

variable "allow_audit_paths" {
  description = "Allow /audit and /v1/tradepass without Bot Control blocking (mobile E2E, default fetch UA)"
  type        = bool
  default     = false
}

resource "aws_wafv2_web_acl" "main" {
  name        = "${var.name_prefix}-waf-${var.aws_region}"
  description = "OWASP CRS + BotControl + RateLimit for ${var.name_prefix}"
  scope       = var.scope

  default_action {
    allow {}
  }

  # Uptime / kubelet-style probes: bare curl without browser User-Agent (INF-49).
  dynamic "rule" {
    for_each = var.allow_health_path ? [1] : []
    content {
      name     = "AllowHealthEndpoint"
      priority = 0

      action {
        allow {}
      }

      statement {
        or_statement {
          statement {
            byte_match_statement {
              search_string         = "/health"
              positional_constraint = "EXACTLY"
              field_to_match {
                uri_path {}
              }
              text_transformation {
                priority = 0
                type     = "LOWERCASE"
              }
            }
          }
          statement {
            byte_match_statement {
              search_string         = "/api/health"
              positional_constraint = "EXACTLY"
              field_to_match {
                uri_path {}
              }
              text_transformation {
                priority = 0
                type     = "LOWERCASE"
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "AllowHealthEndpointMetric"
        sampled_requests_enabled   = true
      }
    }
  }

  # Audit and TradePass endpoints: allow non-browser UAs (mobile E2E, default fetch).
  # Must run before BotControl and CommonRuleSet so API calls with Bearer tokens
  # return JSON 401/200 instead of HTML 403.
  dynamic "rule" {
    for_each = var.allow_audit_paths ? [1] : []
    content {
      name     = "AllowAuditAndTradePassEndpoints"
      priority = 1

      action {
        allow {}
      }

      statement {
        or_statement {
          statement {
            byte_match_statement {
              search_string         = "/audit"
              positional_constraint = "STARTS_WITH"
              field_to_match {
                uri_path {}
              }
              text_transformation {
                priority = 0
                type     = "LOWERCASE"
              }
            }
          }
          statement {
            byte_match_statement {
              search_string         = "/v1/tradepass"
              positional_constraint = "STARTS_WITH"
              field_to_match {
                uri_path {}
              }
              text_transformation {
                priority = 0
                type     = "LOWERCASE"
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "AllowAuditAndTradePassMetric"
        sampled_requests_enabled   = true
      }
    }
  }

  # AWS Managed Rule: OWASP Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2
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
    priority = 3
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
    priority = 4
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
    priority = 5
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
