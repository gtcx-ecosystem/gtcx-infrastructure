variable "cost_profile" {
  description = <<-EOT
    Fleet cost tier per bridgeOS environment-cost-policy.v1.json:
    always_on (production), scheduled (staging), ephemeral (testnet_pilot).
    When set, overrides eks_node_* sizing unless explicit overrides are provided.
  EOT
  type        = string
  default     = null

  validation {
    condition = (
      var.cost_profile == null ||
      contains(["always_on", "scheduled", "ephemeral"], var.cost_profile)
    )
    error_message = "cost_profile must be always_on, scheduled, or ephemeral."
  }
}

variable "eks_node_min_size" {
  description = "Explicit EKS min size override (wins over cost_profile when non-null)."
  type        = number
  default     = null
}

variable "eks_node_desired_size" {
  description = "Explicit EKS desired size override (wins over cost_profile when non-null)."
  type        = number
  default     = null
}

variable "eks_node_max_size" {
  description = "Explicit EKS max size override (wins over cost_profile when non-null)."
  type        = number
  default     = null
}
