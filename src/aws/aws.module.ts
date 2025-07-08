import { Module } from '@nestjs/common';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';
import { ConfigModule } from '@nestjs/config';
import { TokenGuard } from './Guards/token-guard';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule.forRoot(),HttpModule],
  controllers: [AwsController],
  providers: [AwsService,TokenGuard]
})
export class AwsModule {}
