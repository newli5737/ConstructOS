import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('ConstructOS_API');
  const app = await NestFactory.create(AppModule);

  // Enable Cookie Parser for HttpOnly Cookies
  app.use((cookieParser as any).default ? (cookieParser as any).default() : (cookieParser as any)());

  // Strict CORS with Credentials for HttpOnly Cookie transport
  app.enableCors({
    origin: [
      'https://construct.bloxtcgshop.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('constructOS API')
    .setDescription('Hệ thống Quản lý Bán hàng & Kho Vật liệu Xây dựng constructOS')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('jwt')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`constructOS API is running on http://localhost:${port}/api/v1`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
