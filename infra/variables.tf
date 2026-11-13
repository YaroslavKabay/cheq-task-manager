variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "eu-north-1"
}

variable "project" {
  description = "Name prefix and tag for every resource."
  type        = string
  default     = "cheq-task-manager"
}

variable "instance_type" {
  description = "EC2 instance type that runs the container."
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key_path" {
  description = "Path to the public half of the deploy SSH key."
  type        = string
  default     = "~/.ssh/cheq-deploy.pub"
}

variable "ssh_ingress_cidr" {
  description = "CIDR allowed to reach SSH. Open by default because GitHub-hosted runners have no fixed IP range."
  type        = string
  default     = "0.0.0.0/0"
}
