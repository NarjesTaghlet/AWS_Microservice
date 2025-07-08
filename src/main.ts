import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:4200',  // URL of your Angular app (adjust as needed)
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],  // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
  });

  // Listen for HTTP requests on port 3000
  await app.listen(3002);
}
bootstrap();
