terraform {
  backend "s3" {
    bucket         = "terraform-state-user-id"
    key            = "workspace/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}


provider "aws" {
  alias  = "sub_account"
  region = var.aws_region
  assume_role {
    role_arn = "arn:aws:iam::${aws_organizations_account.sub_account.id}:role/OrganizationAccountAccessRole"
  }
}