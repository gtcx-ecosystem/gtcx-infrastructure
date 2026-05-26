# =============================================================================
# ALB Module — Variables
# =============================================================================

variable "environment" {
  description = "Environment name (e.g., zimbabwe-pilot)"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name for Helm provider context"
  type        = string
}

variable "cluster_endpoint" {
  description = "EKS cluster API endpoint"
  type        = string
}

variable "cluster_ca_certificate" {
  description = "Base64-encoded EKS cluster CA certificate"
  type        = string
}

variable "oidc_provider_arn" {
  description = "EKS OIDC provider ARN for IRSA"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for ALB target groups"
  type        = string
}

variable "domain_name" {
  description = "Domain name for ACM certificate (e.g., api.gtcx.io)"
  type        = string
  default     = ""
}

variable "chart_version" {
  description = "AWS Load Balancer Controller Helm chart version"
  type        = string
  default     = "1.7.1"
}

variable "rate_limit" {
  description = "WAF rate limit per 5 minutes per IP"
  type        = number
  default     = 2000
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
