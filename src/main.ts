import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { APP_URLS } from './constants';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? false : ['error', 'warn'],
    bufferLogs: false,
    abortOnError: false,
  });

  // Only serve static files in development or if needed
  if (process.env.NODE_ENV !== 'production') {
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
    });
  }

  // Global pipes, interceptors, and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable CORS for frontend
  app.enableCors({
    origin: [APP_URLS.FRONTEND_URL], // Next.js frontend URL from constants
    credentials: true,
  });

  // Swagger configuration (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Quiz Application API')
      .setDescription(
        'Complete API documentation for Quiz Application with CRUD operations',
      )
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('quizzes', 'Quiz management')
      .addTag('questions', 'Question management')
      .addTag('attempts', 'Quiz attempts')
      .addTag('config', 'Configuration items')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || process.env.APP_PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Port: ${port}`);
  
  // Only log URLs in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Frontend URL: ${APP_URLS.FRONTEND_URL}`);
    console.log(`API Base URL: ${APP_URLS.API_BASE_URL}`);
    console.log(`Swagger Documentation: ${APP_URLS.BACKEND_URL}/api/docs`);
  }
}
bootstrap();
