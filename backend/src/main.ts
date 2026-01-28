import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { join } from 'path';
import * as sharp from 'sharp';
import * as cookieParser from 'cookie-parser';

// Sharp memory optimization - prevents OOM on low RAM environments
// Must be called BEFORE any Sharp operations
sharp.cache(false); // Disable Sharp's internal cache to reduce memory usage
sharp.concurrency(1); // Process images sequentially to limit concurrent memory usage
sharp.simd(false); // Disable SIMD to reduce memory footprint (slight performance trade-off)

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Cookie parser middleware - enables reading cookies from requests
  const cookieSecret = process.env.COOKIE_SECRET || 'diecast360-cookie-secret';
  app.use(cookieParser(cookieSecret));
  
  // Serve static files from uploads directory
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  app.useStaticAssets(join(process.cwd(), uploadDir), {
    prefix: '/uploads',
  });
  
  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

