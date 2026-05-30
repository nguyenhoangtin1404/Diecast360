import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type AlertKind = 'login_failed_spike' | 'account_locked' | 'csrf_rejected' | 'rate_limit_spike';

interface DedupeEntry {
  lastSentMs: number;
  count: number;
}

@Injectable()
export class SecurityAlertService {
  private readonly logger = new Logger(SecurityAlertService.name);
  private readonly dedupe = new Map<string, DedupeEntry>();
  private readonly windowCounts = new Map<string, { count: number; windowStartMs: number }>();

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return (
      this.config.get<string>('SECURITY_ALERTS_ENABLED', 'false').trim().toLowerCase() ===
      'true'
    );
  }

  recordLoginFailed(email: string): void {
    this.bumpWindow('login_failed', 10, 300_000, () => {
      void this.sendDeduped(
        'login_failed_spike',
        `⚠️ Diecast360: ≥10 login failures in 5 minutes.\nLatest email: ${this.maskEmail(email)}`,
      );
    });
  }

  recordAccountLocked(email: string): void {
    void this.sendDeduped(
      'account_locked',
      `🔒 Diecast360: account locked after failed logins.\nEmail: ${this.maskEmail(email)}`,
      0,
    );
  }

  recordCsrfRejected(): void {
    this.bumpWindow('csrf_rejected', 5, 300_000, () => {
      void this.sendDeduped(
        'csrf_rejected',
        '⚠️ Diecast360: CSRF rejections spike (≥5 in 5 minutes).',
      );
    });
  }

  recordRateLimit(path: string): void {
    if (!path.includes('/auth/login')) {
      return;
    }
    this.bumpWindow('rate_limit_login', 50, 300_000, () => {
      void this.sendDeduped(
        'rate_limit_spike',
        '⚠️ Diecast360: high 429 rate on POST /auth/login (≥50 in 5 minutes).',
      );
    });
  }

  private bumpWindow(
    key: string,
    threshold: number,
    windowMs: number,
    onThreshold: () => void,
  ): void {
    const now = Date.now();
    let entry = this.windowCounts.get(key);
    if (!entry || now - entry.windowStartMs >= windowMs) {
      entry = { count: 0, windowStartMs: now };
      this.windowCounts.set(key, entry);
    }
    entry.count += 1;
    if (entry.count === threshold) {
      onThreshold();
    }
  }

  private async sendDeduped(
    kind: AlertKind,
    text: string,
    cooldownMs?: number,
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    const cooldown =
      cooldownMs ??
      this.config.get<number>('SECURITY_ALERT_COOLDOWN_MS', 300_000);
    const now = Date.now();
    const prev = this.dedupe.get(kind);
    if (prev && now - prev.lastSentMs < cooldown) {
      return;
    }
    this.dedupe.set(kind, { lastSentMs: now, count: (prev?.count ?? 0) + 1 });

    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN', '').trim();
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID', '').trim();
    if (!token || !chatId) {
      this.logger.warn('SECURITY_ALERTS_ENABLED but Telegram env is incomplete');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`telegram.send_failed status=${res.status}`);
      }
    } catch (err) {
      this.logger.warn(
        `telegram.send_error err=${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return '***';
    }
    const visible = local.length <= 2 ? '*' : `${local[0]}***`;
    return `${visible}@${domain}`;
  }
}
