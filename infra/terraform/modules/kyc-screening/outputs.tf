output "lambda_arn" {
  description = "ARN of the screening Lambda — pass to the kyc-documents module's S3 event notification block"
  value       = aws_lambda_function.screening.arn
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.screening.function_name
}

output "dlq_arn" {
  description = "Dead-letter queue ARN; operators alert on DLQ depth > 0"
  value       = aws_sqs_queue.dlq.arn
}

output "role_arn" {
  description = "IAM role ARN (for cross-stack references + audit)"
  value       = aws_iam_role.lambda.arn
}
