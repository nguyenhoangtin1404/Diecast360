import { Global, Module } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { LoginAuditService } from './login-audit.service';
import { LoginSecurityService } from './login-security.service';
import { SecurityAlertService } from './security-alert.service';

@Global()
@Module({
  providers: [
    LoginAuditService,
    LoginSecurityService,
    CaptchaService,
    SecurityAlertService,
  ],
  exports: [
    LoginAuditService,
    LoginSecurityService,
    CaptchaService,
    SecurityAlertService,
  ],
})
export class SecurityModule {}
