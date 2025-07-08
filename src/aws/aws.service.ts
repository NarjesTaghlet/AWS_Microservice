import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';



@Injectable()
export class AwsService {
  constructor(private configService: ConfigService) {}

  async createSubAccount(userId: number, subscriptionPlan: string, email: string) {
    try {
      const managementAccountId = process.env.management_accound_id
      // ✅ 1. Validate inputs
      if (!userId || userId <= 0) throw new Error('Invalid userId');
      if (!['small', 'medium', 'advanced'].includes(subscriptionPlan)) {
        throw new Error('Invalid subscription plan');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Invalid email format');
      }

      // ✅ 2. Ensure Terraform is installed
      try {
        execSync('terraform --version', { stdio: 'ignore' });
      } catch {
        throw new Error('Terraform is not installed or not in PATH');
      }

      // ✅ 3. Define Terraform working directory
      const terraformDir = path.join('src', 'terraform', 'workspace');

      if (!fs.existsSync(terraformDir)) {
        fse.copySync(path.join('src', 'terraform', 'template'), terraformDir);
        console.log(`🔹 Copied Terraform template to ${terraformDir}`);
      }

      // ✅ 4. Change working directory safely
      const originalDir = process.cwd();
      process.chdir(terraformDir);

      try {
        console.log('🚀 Running Terraform Init with S3 backend...');
        execSync(
          `terraform init -backend-config="bucket=terraform-state-user-id" -backend-config="key=workspace/terraform.tfstate" -backend-config="region=us-east-1" -backend-config="dynamodb_table=terraform-locks"`,
          { stdio: 'inherit' }
        );

        // Create or select a workspace for the userId
        console.log(`🔹 Creating/Selecting Terraform workspace for userId ${userId}...`);
        try {
          execSync(`terraform workspace select user-${userId}`, { stdio: 'inherit' });
        } catch {
          execSync(`terraform workspace new user-${userId}`, { stdio: 'inherit' });
        }

        console.log('🛠 Running Terraform Plan...');
        execSync(
          `terraform plan -out=plan1 -var="user_id=${userId}" -var="subscription_plan=${subscriptionPlan}" -var="email=${email}" -var="management_account_id=${managementAccountId}"`,
          { stdio: 'inherit' }
        );

        console.log('✅ Applying Terraform Plan...');
        execSync('terraform apply -auto-approve plan1', { stdio: 'inherit' });

        console.log('🔍 Fetching Terraform Outputs...');
        const output = execSync('terraform output -json', { encoding: 'utf-8' });

        let outputs;
        try {
          outputs = JSON.parse(output);
        } catch {
          throw new Error('Failed to parse Terraform output JSON');
        }

        const subAccountId = outputs?.sub_account_id?.value || null;
        const accessKeyId = outputs?.sub_account_access_key_id?.value || null;
        const secretAccessKey = outputs?.sub_account_secret_access_key?.value || null;
        const userArn = outputs?.sub_account_user_arn?.value || null;

        if (!subAccountId || !accessKeyId || !secretAccessKey || !userArn) {
          throw new Error('Missing required Terraform outputs');
        }

        console.log('🎯 AWS Sub-Account Created Successfully');

        // ✅ 5. Cleanup Terraform Plan File
        try {
          fs.unlinkSync(path.join(terraformDir, 'plan1'));
        } catch {
          console.warn('⚠️ Failed to delete Terraform plan file (not critical)');
        }

        return { accountId: subAccountId, userArn, accessKeyId, secretAccessKey };
      } finally {
        // ✅ 6. Restore original directory
        process.chdir(originalDir);
      }
    } catch (error) {
      console.error('❌ Error in Terraform execution:', error);
      throw new Error(`AWS Sub-Account creation failed: ${error.message}`);
    }


    // after setting up sub account , setup the backend for the sub account 
    // 1 . call the api of  connect aws  
    //2 . setting up remote backend  
    // 3 . IAM roles in the remote backend 
    // 4 . Notify the user per mail for the creation of its account !

      
  }
  


}