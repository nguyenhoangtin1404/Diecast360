import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly provider: string;

  constructor(private readonly config: ConfigService) {
    this.provider = config.get<string>('EMAIL_PROVIDER', 'mock');
  }

  onModuleInit(): void {
    if (this.provider === 'resend' && !this.config.get<string>('RESEND_API_KEY')) {
      throw new Error('EMAIL_PROVIDER=resend requires RESEND_API_KEY to be set');
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    if (this.provider === 'resend') {
      await this.sendViaResend(to, resetUrl);
    } else {
      this.logger.log(
        `[MOCK EMAIL] To: ${to} | Reset URL: ${resetUrl} | Set EMAIL_PROVIDER=resend to send real emails.`,
      );
    }
  }

  private async sendViaResend(to: string, resetUrl: string): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')!;
    const fromAddress = this.config.get<string>('EMAIL_FROM', 'noreply@diecast360.vn');

    const body = JSON.stringify({
      from: fromAddress,
      to: [to],
      subject: '[Diecast360] Đặt lại mật khẩu',
      html: buildResetEmailHtml(resetUrl),
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Resend API error ${res.status}: ${text}`);
      throw new Error(`Failed to send password reset email: Resend ${res.status}`);
    }

    this.logger.log(`Password reset email sent to ${to}`);
  }
}

function buildResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8" /><title>Đặt lại mật khẩu</title></head>
<body style="font-family:sans-serif;background:#f8fafc;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
    <h2 style="color:#1e293b;margin-top:0">Đặt lại mật khẩu Diecast360</h2>
    <p style="color:#475569">Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu.</p>
    <p style="color:#475569">Nhấn nút bên dưới để tạo mật khẩu mới. Link có hiệu lực trong <strong>1 giờ</strong>.</p>
    <a href="${resetUrl}"
       style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
      Đặt lại mật khẩu
    </a>
    <p style="color:#94a3b8;font-size:12px;margin-bottom:0">
      Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.<br />
      Link: <a href="${resetUrl}" style="color:#94a3b8">${resetUrl}</a>
    </p>
  </div>
</body>
</html>`;
}
