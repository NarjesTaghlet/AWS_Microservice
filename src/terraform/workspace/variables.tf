variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "management_account_id" {
  description = "The ID of the Management Account"
  type        = string
}

variable "user_id" {
  description = "The ID of the user"
  type        = string
  validation {
    condition     = can(tonumber(var.user_id))
    error_message = "user_id must be a numeric value (e.g., '100')."
  }
}

variable "subscription_plan" {
  description = "The subscription plan of the user"
  type        = string
  validation {
    condition     = contains(["small", "medium", "advanced"], var.subscription_plan)
    error_message = "subscription_plan must be one of: small, medium, large."
  }
}

variable "email" {
  description = "The email address for the sub-account"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.email))
    error_message = "email must be a valid email address (e.g., user@example.com)."
  }
}