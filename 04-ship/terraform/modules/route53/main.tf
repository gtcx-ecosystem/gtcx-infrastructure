# =============================================================================
# GTCX Route53 Module
# =============================================================================
# Manages DNS for environments under a pre-existing public hosted zone.
#
# Out-of-band assumptions:
#   - The apex domain hosted zone (e.g. gtcx.trade) already exists in the
#     account. Apex zone registration is owner-procurement and not in IaC.
#     We data-source it; we do NOT create it.
#   - Subdomain delegation (e.g. staging.gtcx.trade NS records) is either
#     in the same apex zone or already delegated. This module assumes
#     same-zone hosting; cross-account delegation needs `aws_route53_zone`
#     in the child account, which is out of scope.
#
# Resources:
#   1. Data lookup of the apex hosted zone.
#   2. A (ALIAS) records for each hostname → ALB.
#   3. CNAME records for ACM certificate DNS validation (optional but
#      strongly recommended — makes cert renewal hands-off).
#
# Chicken-and-egg note:
#   The ALB is created by the AWS Load Balancer Controller in response to
#   a Kubernetes Ingress resource — its DNS name is not known until then.
#   Two safe patterns for first apply:
#     (a) Apply with alb_dns_name = "" once, deploy the Ingress, then
#         re-apply with the resolved ALB DNS name and zone ID.
#     (b) Use external-dns inside the cluster to write the A records
#         directly from Ingress annotations. In that case this module is
#         only responsible for ACM validation records and external-dns
#         takes over A-record management. See INF-49 runbook.
# =============================================================================

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Module      = "route53"
  })

  zone_name = var.apex_domain

  hostname_suffix = var.subdomain == "" ? var.apex_domain : "${var.subdomain}.${var.apex_domain}"

  create_a_records = var.alb_dns_name != "" && var.alb_zone_id != ""
}

# -----------------------------------------------------------------------------
# Hosted Zone Lookup (apex, public)
# -----------------------------------------------------------------------------

data "aws_route53_zone" "apex" {
  name         = "${local.zone_name}."
  private_zone = false
}

# -----------------------------------------------------------------------------
# A (ALIAS) records → ALB
# -----------------------------------------------------------------------------
# One per hostname, each ALIAS-aliased to the ALB. Health check unset
# because ALB controller already health-checks targets and we want DNS
# to resolve even during partial backend outages (UX > strict closure).

resource "aws_route53_record" "host" {
  for_each = local.create_a_records ? toset(var.hostnames) : toset([])

  zone_id = data.aws_route53_zone.apex.zone_id
  name    = "${each.value}.${local.hostname_suffix}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = false
  }
}

# -----------------------------------------------------------------------------
# ACM Certificate DNS Validation Records
# -----------------------------------------------------------------------------
# Wired from the ALB module's certificate_domain_validation output so
# cert issuance and renewal are fully IaC-managed. If the cert was
# initially validated manually, run `terraform import` against the
# existing records or recreate them — they are idempotent.

resource "aws_route53_record" "acm_validation" {
  for_each = {
    for r in var.acm_validation_records : r.name => r...
  }

  zone_id = data.aws_route53_zone.apex.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.value]
  ttl     = 60

  allow_overwrite = true
}
