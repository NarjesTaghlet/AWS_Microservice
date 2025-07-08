output "sub_account_id" {
  description = "The ID of the created sub-account"
  value       = aws_organizations_account.sub_account.id
}

output "sub_account_access_key_id" {
  description = "The access key ID for the IAM user in the sub-account"
  value       = aws_iam_access_key.sub_account_user_key.id
  sensitive   = true
}

output "sub_account_secret_access_key" {
  description = "The secret access key for the IAM user in the sub-account"
  value       = aws_iam_access_key.sub_account_user_key.secret
  sensitive   = true
}

output "sub_account_user_arn" {
  description = "The ARN of the IAM user in the sub-account"
  value       = "arn:aws:iam::${aws_organizations_account.sub_account.id}:user/user-${var.user_id}"
}

output "organization_access_role_arn" {
  value = "arn:aws:iam::${aws_organizations_account.sub_account.id}:role/OrganizationAccountAccessRole"
}

output "management_account_id" {
  value = data.aws_organizations_organization.org.master_account_id
}
