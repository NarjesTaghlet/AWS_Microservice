import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AwsModule } from './aws/aws.module';
import { ConfigModule } from '@nestjs/config';
import { TokenGuard } from './aws/Guards/token-guard';

@Module({
  imports: [AwsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
