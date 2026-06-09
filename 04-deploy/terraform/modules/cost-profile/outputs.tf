output "node_min_size" {
  description = "Resolved EKS node group minimum size."
  value = coalesce(
    var.eks_node_min_size,
    try(local.from_profile.min, null),
    0
  )
}

output "node_desired_size" {
  description = "Resolved EKS node group desired size."
  value = coalesce(
    var.eks_node_desired_size,
    try(local.from_profile.desired, null),
    0
  )
}

output "node_max_size" {
  description = "Resolved EKS node group maximum size."
  value = coalesce(
    var.eks_node_max_size,
    try(local.from_profile.max, null),
    1
  )
}

output "cost_profile" {
  description = "Active cost profile name, if any."
  value       = var.cost_profile
}
