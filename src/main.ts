import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Trust proxy for Render/Vercel (required for secure cookies behind reverse proxy)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // CORS — allow frontend to send cookies
  app.enableCors({
    origin: true, // Automatically allow the requesting origin
    credentials: true,
  });

  // Cookie parser
  app.use(cookieParser());

  // Validation pipe — DTO validators work globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}/api/v1`);
}
bootstrap();