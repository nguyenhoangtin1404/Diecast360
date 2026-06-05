import {
  Body,
  Controller,
  INestApplication,
  Post,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginAuditInterceptor } from './login-audit.interceptor';
import { LoginAuditService } from '../common/security/login-audit.service';

jest.mock('./login-trace-id', () => ({
  createLoginTraceId: jest.fn(() => 'trace-mock-00000000-0000-7000-8000-000000000003'),
}));

class LoginBodyDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

@Controller('auth')
class TestLoginController {
  @Post('login')
  @UseInterceptors(LoginAuditInterceptor)
  login(@Body() _dto: LoginBodyDto) {
    return { user: { id: 'user-1', email: 'admin@test.com' }, message: 'ok' };
  }
}

describe('Login audit integration (validation failures)', () => {
  let app: INestApplication;
  let loginAuditService: { record: jest.Mock };

  beforeEach(async () => {
    loginAuditService = { record: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [TestLoginController],
      providers: [
        LoginAuditInterceptor,
        { provide: LoginAuditService, useValue: loginAuditService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  it('audits validation_error when email is invalid', async () => {
    const address = app.getHttpServer().address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const response = await fetch(`http://127.0.0.1:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('x-trace-id')).toBe(
      'trace-mock-00000000-0000-7000-8000-000000000003',
    );
    expect(loginAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        failureReason: 'validation_error',
      }),
    );
  });
});
