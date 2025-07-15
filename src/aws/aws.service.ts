import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

@Injectable()
export class AwsService {
  constructor(private configService: ConfigService) {}

  async createSubAccount(userId: number, subscriptionPlan: string, email: string) {
    try {
      const managementAccountId = process.env.management_accound_id;

      // ✅ 1. Validate inputs
      if (!userId || userId <= 0) throw new Error('Invalid userId');
      if (!['small', 'medium', 'advanced'].includes(subscriptionPlan)) {
        throw new Error('Invalid subscription plan');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Invalid email format');
      }

      // ✅ 2. Check Terraform is installed
      try {
        execSync('terraform --version', { stdio: 'ignore' });
      } catch {
        throw new Error('Terraform is not installed or not in PATH');
      }

      // ✅ 3. Set working directory
      const terraformDir = path.join('src', 'terraform', 'workspace');
      const templateDir = path.join('src', 'terraform', 'template');

      // If workspace dir does not exist, manually copy the files from template
      if (!fs.existsSync(terraformDir)) {
        await fsPromises.mkdir(terraformDir, { recursive: true });
        const files = await fsPromises.readdir(templateDir);

        for (const file of files) {
          const src = path.join(templateDir, file);
          const dest = path.join(terraformDir, file);
          const stat = await fsPromises.stat(src);
          if (stat.isDirectory()) {
            await fsPromises.cp(src, dest, { recursive: true });
          } else {
            await fsPromises.copyFile(src, dest);
          }
        }
        console.log(`🔹 Copied Terraform template to ${terraformDir}`);
      }

      // ✅ 4. Change working directory
      const originalDir = process.cwd();
      process.chdir(terraformDir);

      try {
        console.log('🚀 Running Terraform Init...');
        execSync(
          `terraform init -backend-config="bucket=terraform-state-user-id" -backend-config="key=workspace/terraform.tfstate" -backend-config="region=us-east-1" -backend-config="dynamodb_table=terraform-locks"`,
          { stdio: 'inherit' }
        );

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
        const outputs = JSON.parse(output);

        const subAccountId = outputs?.sub_account_id?.value;
        const accessKeyId = outputs?.sub_account_access_key_id?.value;
        const secretAccessKey = outputs?.sub_account_secret_access_key?.value;
        const userArn = outputs?.sub_account_user_arn?.value;

        if (!subAccountId || !accessKeyId || !secretAccessKey || !userArn) {
          throw new Error('Missing required Terraform outputs');
        }

        console.log('🎯 AWS Sub-Account Created Successfully');

        // ✅ 5. Clean up
        try {
          await fsPromises.unlink(path.join(terraformDir, 'plan1'));
        } catch {
          console.warn('⚠️ Failed to delete Terraform plan file');
        }

        return { accountId: subAccountId, userArn, accessKeyId, secretAccessKey };
      } finally {
        process.chdir(originalDir);
      }
    } catch (error) {
      console.error('❌ Error in Terraform execution:', error);
      throw new Error(`AWS Sub-Account creation failed: ${error.message}`);
    }

    // TODO:
    // 1. call AWS API to setup backend
    // 2. configure remote backend
    // 3. create IAM roles
    // 4. send notification email
  }
}
