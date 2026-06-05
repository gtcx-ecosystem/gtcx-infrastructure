# =============================================================================
# Route53 Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates DNS record creation and the chicken-and-egg first-apply path.
# =============================================================================

mock_provider "aws" {
  mock_data "aws_route53_zone" {
    defaults = {
      zone_id = "Z123FAKEZONEID"
      name    = "gtcx.trade."
    }
  }
}

variables {
  environment = "test"
  apex_domain = "gtcx.trade"
  subdomain   = "staging"
  hostnames   = ["api", "geotag"]
}

# -----------------------------------------------------------------------------
# First-apply path: ALB DNS unknown, only ACM validation records expected
# -----------------------------------------------------------------------------

run "first_apply_skips_a_records_when_alb_unset" {
  command = plan

  variables {
    alb_dns_name = ""
    alb_zone_id  = ""
    acm_validation_records = [{
      name  = "_abc.gtcx.trade."
      type  = "CNAME"
      value = "_xyz.acm-validations.aws."
    }]
  }

  assert {
    condition     = length(aws_route53_record.host) == 0
    error_message = "A records must NOT be created on first apply when alb_dns_name is empty"
  }

  assert {
    condition     = length(aws_route53_record.acm_validation) == 1
    error_message = "ACM validation records must be created even when alb_dns_name is empty"
  }
}

# -----------------------------------------------------------------------------
# Second-apply path: ALB resolved, A records expected
# -----------------------------------------------------------------------------

run "second_apply_creates_one_a_record_per_hostname" {
  command = plan

  variables {
    alb_dns_name           = "k8s-gtcxstag-test-1234567890.af-south-1.elb.amazonaws.com"
    alb_zone_id            = "Z268VQBMOI5EKX"
    acm_validation_records = []
  }

  assert {
    condition     = length(aws_route53_record.host) == 2
    error_message = "One A record must be created per hostname input"
  }

  assert {
    condition     = aws_route53_record.host["api"].name == "api.staging.gtcx.trade"
    error_message = "FQDN must combine hostname + subdomain + apex"
  }

  assert {
    condition     = aws_route53_record.host["api"].type == "A"
    error_message = "Hostname records must be A (ALIAS) records, not CNAME"
  }
}

# -----------------------------------------------------------------------------
# No subdomain: hostnames live directly under apex
# -----------------------------------------------------------------------------

run "empty_subdomain_places_hostnames_under_apex" {
  command = plan

  variables {
    subdomain    = ""
    hostnames    = ["api"]
    alb_dns_name = "k8s-test-1234567890.af-south-1.elb.amazonaws.com"
    alb_zone_id  = "Z268VQBMOI5EKX"
  }

  assert {
    condition     = aws_route53_record.host["api"].name == "api.gtcx.trade"
    error_message = "When subdomain is empty, hostnames live directly under the apex domain"
  }
}
