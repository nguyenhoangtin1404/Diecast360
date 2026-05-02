import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Liveness + DB connectivity — dùng cho deploy probe (GET, không CSRF). */
  @SkipThrottle()
  @Get('health')
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new HttpException(
        { ok: false, status: 'unhealthy' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return { ok: true, status: 'healthy' };
  }
}

