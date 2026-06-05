# =============================================================================
# Route53 Module — Outputs
# =============================================================================

output "zone_id" {
  description = "Hosted zone ID for the apex domain"
  value       = data.aws_route53_zone.apex.zone_id
}

output "zone_name" {
  description = "Hosted zone name (apex domain)"
  value       = data.aws_route53_zone.apex.name
}

output "hostname_fqdns" {
  description = "Fully-qualified hostnames managed by this module (one entry per hostname input)"
  value       = [for h in var.hostnames : "${h}.${local.hostname_suffix}"]
}

output "a_records_created" {
  description = "Whether A (ALIAS) records were created. False on first apply before the ALB exists."
  value       = local.create_a_records
}

output "acm_validation_record_fqdns" {
  description = "FQDNs of ACM validation records managed by this module (for cross-referencing ACM validation status)"
  value       = [for r in aws_route53_record.acm_validation : r.fqdn]
}
