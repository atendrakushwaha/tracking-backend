import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS — allow frontend to send cookies
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174',"https://tracking-frontend-self.vercel.app","https://tracking-frontend-self.vercel.app/login"],
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