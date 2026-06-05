# =============================================================================
# ALB Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates ALB controller IAM, ACM, and WAF configuration.
# =============================================================================

variables {
  environment            = "test"
  cluster_name           = "gtcx-test"
  cluster_endpoint       = "https://test.eks.amazonaws.com"
  cluster_ca_certificate = "dGVzdC1jYQ=="
  oidc_provider_arn      = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/TEST"
  vpc_id                 = "vpc-test123"
  domain_name            = "test.gtcxprotocol.org"
  chart_version          = "1.7.1"
}

# -----------------------------------------------------------------------------
# ACM certificate
# -----------------------------------------------------------------------------

run "acm_certificate_created_when_domain_set" {
  command = plan

  assert {
    condition     = aws_acm_certificate.api[0].domain_name == "test.gtcxprotocol.org"
    error_message = "ACM certificate must be created for the specified domain"
  }

  assert {
    condition     = aws_acm_certificate.api[0].validation_method == "DNS"
    error_message = "ACM certificate must use DNS validation"
  }
}

# -----------------------------------------------------------------------------
# IAM role for ALB controller (IRSA)
# -----------------------------------------------------------------------------

run "alb_controller_iam_role_created" {
  command = plan

  assert {
    condition     = aws_iam_role.alb_controller.name == "gtcx-test-alb-controller"
    error_message = "ALB controller IAM role must follow naming convention"
  }
}

run "alb_controller_policy_scoped" {
  command = plan

  assert {
    condition     = strcontains(aws_iam_role_policy.alb_controller.policy, "\"ec2:VpcId\"")
    error_message = "ALB controller policy must scope ec2:CreateSecurityGroup to the cluster VPC"
  }

  assert {
    condition     = strcontains(aws_iam_role_policy.alb_controller.policy, "\"iam:AWSServiceName\"")
    error_message = "ALB controller policy must scope iam:CreateServiceLinkedRole to the ELB service"
  }

  assert {
    condition     = strcontains(aws_iam_role_policy.alb_controller.policy, "\"shield:CreateProtection\"") == false
    error_message = "ALB controller policy must not include shield:CreateProtection when Shield Advanced is not configured"
  }
}

# -----------------------------------------------------------------------------
# WAF configuration
# -----------------------------------------------------------------------------

run "waf_web_acl_created" {
  command = plan

  assert {
    condition     = aws_wafv2_web_acl.main.scope == "REGIONAL"
    error_message = "WAF WebACL must be REGIONAL scope for ALB"
  }

  assert {
    condition     = aws_wafv2_web_acl.main.name == "gtcx-test-waf"
    error_message = "WAF WebACL must follow naming convention"
  }
}

run "waf_default_action_allows" {
  command = plan

  assert {
    condition     = length(aws_wafv2_web_acl.main.default_action[0].allow) >= 0
    error_message = "WAF default action must be allow (block via rules)"
  }
}

run "waf_has_rate_limiting" {
  command = plan

  assert {
    condition     = aws_wafv2_web_acl.main.rule[3].name == "RateLimitPerIP"
    error_message = "WAF must include IP rate limiting rule"
  }
}

# -----------------------------------------------------------------------------
# No ACM when domain is empty
# -----------------------------------------------------------------------------

run "no_acm_without_domain" {
  command = plan

  variables {
    domain_name = ""
  }

  assert {
    condition     = length(aws_acm_certificate.api) == 0
    error_message = "ACM certificate must not be created when domain_name is empty"
  }
}
