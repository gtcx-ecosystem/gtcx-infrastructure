# =============================================================================
# GTCX Workflow Orchestration Module — Outputs
# =============================================================================

output "namespace" {
  description = "Kubernetes namespace where Argo Workflows is deployed"
  value       = helm_release.argo_workflows.namespace
}

output "workflow_role_arn" {
  description = "IAM role ARN for workflow service account (IRSA)"
  value       = aws_iam_role.workflow.arn
}

output "workflow_service_account" {
  description = "Service account name for workflow runs"
  value       = kubernetes_service_account.workflow.metadata[0].name
}

output "workflow_template_name" {
  description = "Name of the fine-tune WorkflowTemplate"
  value       = "intelligence-fine-tune-cycle"
}

output "cron_workflow_name" {
  description = "Name of the bi-weekly CronWorkflow"
  value       = "intelligence-fine-tune-biweekly"
}
