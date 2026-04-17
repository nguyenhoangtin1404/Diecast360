import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { join } from 'path';
import * as sharp from 'sharp';
import * as cookieParser from 'cookie-parser';

/** Merge FRONTEND_URL + FRONTEND_URLS and add localhost ↔ 127.0.0.1 variants (same port). */
function buildCorsAllowedOrigins(): string[] {
  const primary = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
  const extras = (process.env.FRONTEND_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out = new Set<string>();
  for (const raw of [primary, ...extras]) {
    if (!raw) continue;
    out.add(raw);
    try {
      const u = new URL(raw);
      if (u.hostname === 'localhost') {
        u.hostname = '127.0.0.1';
        out.add(u.origin);
      } else if (u.hostname === '127.0.0.1') {
        u.hostname = 'localhost';
        out.add(u.origin);
      }
    } catch {
      /* ignore malformed */
    }
  }
  return [...out];
}

function isPrivateLanOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const { hostname } = u;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    return (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
}

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

  const corsOrigins = buildCorsAllowedOrigins();
  const allowLanCors =
    process.env.CORS_ALLOW_LAN === 'true' ||
    (process.env.CORS_ALLOW_LAN !== 'false' && process.env.NODE_ENV !== 'production');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.includes(origin)) {
        callback(null, origin);
        return;
      }
      if (allowLanCors && isPrivateLanOrigin(origin)) {
        callback(null, origin);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

