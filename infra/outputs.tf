output "public_ip" {
  description = "Elastic IP of the instance."
  value       = aws_eip.app.public_ip
}

output "app_url" {
  description = "Public URL of the deployed app."
  value       = "http://${aws_eip.app.public_ip}"
}

output "ecr_repository_url" {
  description = "Registry URL the pipeline pushes to."
  value       = aws_ecr_repository.app.repository_url
}

output "ssh_command" {
  description = "Shell access to the instance."
  value       = "ssh -i ~/.ssh/cheq-deploy ec2-user@${aws_eip.app.public_ip}"
}

output "ci_access_key_id" {
  description = "Access key id for the pipeline user."
  value       = aws_iam_access_key.ci.id
}

output "ci_secret_access_key" {
  description = "Secret key for the pipeline user."
  value       = aws_iam_access_key.ci.secret
  sensitive   = true
}
