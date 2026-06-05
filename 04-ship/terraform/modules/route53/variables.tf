# =============================================================================
# Route53 Module — Variables
# =============================================================================

variable "environment" {
  description = "Environment name (staging, production, testnet-pilot)"
  type        = string
}

variable "apex_domain" {
  description = "Apex domain managed by the existing public hosted zone (e.g. gtcx.trade)"
  type        = string
}

variable "subdomain" {
  description = "Subdomain under apex used by this environment (e.g. staging). Empty for apex."
  type        = string
  default     = ""
}

variable "hostnames" {
  description = "Hostnames (full FQDN-leading labels under <subdomain>.<apex>) that should resolve to the ALB. Example: [\"api\", \"geotag\"]"
  type        = list(string)
  default     = []
}

variable "alb_dns_name" {
  description = "DNS name of the ALB created by the AWS Load Balancer Controller (e.g. k8s-gtcxstag-...elb.amazonaws.com). Pass empty string to skip A-record creation (e.g. first apply before Ingress exists)."
  type        = string
  default     = ""
}

variable "alb_zone_id" {
  description = "Hosted zone ID of the ALB (af-south-1: Z268VQBMOI5EKX). Pass empty string with alb_dns_name to skip A-record creation."
  type        = string
  default     = ""
}

variable "acm_validation_records" {
  description = "ACM certificate domain_validation_options from the ALB module's certificate_domain_validation output. Wired so DNS validation is fully Terraform-managed."
  type = list(object({
    name  = string
    type  = string
    value = string
  }))
  default = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
