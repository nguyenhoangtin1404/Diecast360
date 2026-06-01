import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode, AppException } from '../exceptions/http-exception.filter';
import { PrismaService } from '../prisma/prisma.service';

interface EmailWindow {
  count: number;
  windowStartMs: number;
}

@Injectable()
export class LoginSecurityService {
  private readonly emailWindows = new Map<string, EmailWindow>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /** Check rate limit without incrementing — call before attempting authentication. */
  assertEmailRateLimit(email: string): void {
    const limit = Number(this.config.get<string>('AUTH_EMAIL_RATE_LIMIT', '10'));
    const windowMs = Number(this.config.get<string>('AUTH_EMAIL_RATE_WINDOW_MS', '900000'));
    const key = this.normalizeEmail(email);
    const now = Date.now();
    const entry = this.emailWindows.get(key);
    if (entry && now - entry.windowStartMs < windowMs && entry.count >= limit) {
      throw new AppException(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many login attempts for this account. Please try again later.',
        [],
        undefined,
        Math.ceil((entry.windowStartMs + windowMs - now) / 1000),
      );
    }
  }

  /** Increment the failed-attempt counter for an email. Call only after a failed login. */
  recordEmailFailedAttempt(email: string): void {
    const windowMs = Number(this.config.get<string>('AUTH_EMAIL_RATE_WINDOW_MS', '900000'));
    const key = this.normalizeEmail(email);
    const now = Date.now();
    let entry = this.emailWindows.get(key);
    if (!entry || now - entry.windowStartMs >= windowMs) {
      if (this.emailWindows.size >= 1000) {
        // First try evicting expired entries.
        for (const [k, v] of this.emailWindows) {
          if (now - v.windowStartMs >= windowMs) this.emailWindows.delete(k);
        }
        // If still at cap (all entries unexpired), evict the oldest to enforce hard cap.
        if (this.emailWindows.size >= 1000) {
          let oldestKey = '';
          let oldestTime = Infinity;
          for (const [k, v] of this.emailWindows) {
            if (v.windowStartMs < oldestTime) {
              oldestTime = v.windowStartMs;
              oldestKey = k;
            }
          }
          if (oldestKey) this.emailWindows.delete(oldestKey);
        }
      }
      entry = { count: 0, windowStartMs: now };
      this.emailWindows.set(key, entry);
    }
    entry.count += 1;
  }

  async assertAccountNotLocked(user: {
    id: string;
    locked_until: Date | null;
  }): Promise<void> {
    if (!user.locked_until) {
      return;
    }
    const now = new Date();
    if (user.locked_until <= now) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { locked_until: null, failed_login_count: 0 },
      });
      return;
    }
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((user.locked_until.getTime() - now.getTime()) / 1000),
    );
    throw new AppException(
      ErrorCode.AUTH_ACCOUNT_LOCKED,
      'Account temporarily locked due to too many failed login attempts. Please try again later.',
      [],
      undefined,
      retryAfterSeconds,
    );
  }

  async recordFailedLogin(userId: string): Promise<{ locked: boolean; lockedUntil?: Date }> {
    const threshold = Number(this.config.get<string>('AUTH_LOCKOUT_THRESHOLD', '5'));
    const lockMs = Number(this.config.get<string>('AUTH_LOCKOUT_DURATION_MS', '1800000'));

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failed_login_count: { increment: 1 } },
      select: { failed_login_count: true },
    });

    if (user.failed_login_count < threshold) {
      return { locked: false };
    }

    const lockedUntil = new Date(Date.now() + lockMs);
    await this.prisma.user.update({
      where: { id: userId },
      data: { locked_until: lockedUntil },
    });
    return { locked: true, lockedUntil };
  }

  getLockoutRetryAfterSeconds(): number {
    const lockMs = Number(this.config.get<string>('AUTH_LOCKOUT_DURATION_MS', '1800000'));
    return Math.ceil(lockMs / 1000);
  }

  async recordSuccessfulLogin(userId: string, email?: string): Promise<void> {
    if (email) {
      this.emailWindows.delete(this.normalizeEmail(email));
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { failed_login_count: 0, locked_until: null },
    });
  }
}
