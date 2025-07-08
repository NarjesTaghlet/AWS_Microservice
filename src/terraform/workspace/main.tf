# Data source to get the root OU ID of the organization



data "aws_organizations_organization" "org" {}

# Create a new sub-account under the root (no need to check for "mat-it" OU)
resource "aws_organizations_account" "sub_account" {
  name  = "user-${var.user_id}"
  email = var.email

  parent_id = data.aws_organizations_organization.org.roots[0].id  

  # Allow IAM users in the sub-account to access billing
  iam_user_access_to_billing = "DENY"

  # Role name for the management account to access the sub-account
  role_name = "OrganizationAccountAccessRole"

  # Add tags for tracking
  tags = {
    SubscriptionPlan = var.subscription_plan
    UserId           = var.user_id
    CreatedBy        = "terraform"
    CreatedAt        = timestamp()
  }

  # Ensure the account is closed when destroyed
  lifecycle {
    ignore_changes = [email] 
    #prevent_destroy = true
    #prevent_destroy = true  # 🔥 Prevent accidental desletion!
  
}
}
# Create an IAM user in the sub-account
resource "aws_iam_user" "sub_account_user" {
  provider = aws.sub_account
  name     = "user-${var.user_id}"
  
}

#Attach a policy to the OrganizationAccountAccessRole for deploying infrastructure and monitoring
resource "aws_iam_role_policy" "organization_access_policy" {
  provider = aws.sub_account
  name     = "OrganizationAccessPolicy"
  role     = "OrganizationAccountAccessRole"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "ecs:*",
          "ecr:*", 
          "eks:*",
          "s3:*",
          "rds:*",
          "iam:PassRole",
          "iam:GetRole",
          "iam:ListRoles",
          "cloudwatch:*",
          "logs:*",
          "cloudtrail:*",
          "sns:*",
          "lambda:*",     
          "dynamodb:*",   
          "elasticloadbalancing:*", 
          "autoscaling:*"
          
        ]
        Resource = "*"
      }
    ]
  })

  # Ensure the sub-account is created before attaching the policy
  depends_on = [aws_organizations_account.sub_account]
}


# Create access keys for the IAM user
resource "aws_iam_access_key" "sub_account_user_key" {
  provider = aws.sub_account
  user     = aws_iam_user.sub_account_user.name
}


/*data "aws_iam_user" "existing_user" {
  //provider = aws.sub_account
  user_name = "user-${var.user_id}"
}

# Créer la politique Lightsail dans le sous-compte
resource "aws_iam_policy" "lightsail_access" {
  //provider    = aws.sub_account
  name        = "LightsailFullAccess-${var.user_id}"
  description = "Accès complet à Lightsail pour ${var.user_id}"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = "lightsail:*",
      Resource = "*"
    }]
  })
}

# Attacher la politique à l'utilisateur existant
resource "aws_iam_user_policy_attachment" "attach_lightsail" {
  //provider   = aws.sub_account
  user       = data.aws_iam_user.existing_user.user_name
  policy_arn = aws_iam_policy.lightsail_access.arn
}
*/