import { Controller, Post, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { AwsService } from './aws.service';
import { TokenGuard } from 'src/aws/Guards/token-guard'
import { Request } from '@nestjs/common';

@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @UseGuards(TokenGuard)
  @Post('create-sub-account')
  async createSubAccount(@Body() body: { subscriptionPlan: string }, @Request() req) {

    const userId = req.user.userId ;
    const email = req.user.email ; 
    const { subscriptionPlan } = body;

    console.log(userId , email , subscriptionPlan)

    // Vérification des champs requis
    if (!userId || !subscriptionPlan || !email) {
      throw new BadRequestException('userId, subscriptionPlan et email sont obligatoires');
    }

    try {
      const result = await this.awsService.createSubAccount(userId, subscriptionPlan, email);
      return {
        message: 'Sous-compte AWS créé avec succès',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Erreur lors de la création du sous-compte: ${error.message}`);
    }
  }
}
