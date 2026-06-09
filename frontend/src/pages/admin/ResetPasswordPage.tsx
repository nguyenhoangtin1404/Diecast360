import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Lock, AlertCircle, CheckCircle2, Loader2, Box, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ROUTES } from '../../config/routes';
import type { ApiErrorResponse } from '../../types/item.types';
import {
  analyzePasswordStrength,
  isPasswordStrongEnough,
  PASSWORD_POLICY_MESSAGE,
  passwordStrengthLabelColor,
  passwordStrengthMeterFill,
} from '../admin/shops/hooks/usePasswordStrength';

function getErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorResponse>(err)) {
    const code = (err.response?.data as { error?: { code?: string } } | undefined)?.error?.code;
    if (code === 'PASSWORD_RESET_TOKEN_EXPIRED') {
      return 'Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới.';
    }
    if (code === 'PASSWORD_RESET_TOKEN_INVALID') {
      return 'Link đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.';
    }
    return err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Invalid link — no token in URL
  if (!token) {
    return (
      <div className="relative min-h-screen bg-[#F8FAFC] px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-corporate-card text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-400" strokeWidth={1.5} aria-hidden />
          <h2 className="text-lg font-bold text-slate-900">Link không hợp lệ</h2>
          <p className="mt-2 text-sm text-slate-500">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
          <Link
            to={ROUTES.adminForgotPassword}
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-shop to-shopAccent px-6 py-2.5 text-sm font-bold text-white shadow-corporate-btn"
          >
            Yêu cầu link mới
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    if (!isPasswordStrongEnough(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.adminLogin), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = analyzePasswordStrength(password);
  const strengthColor = password.length > 0 ? passwordStrengthLabelColor(pwdStrength.labelKey) : passwordStrengthLabelColor('empty');
  const meterFill = passwordStrengthMeterFill(pwdStrength.labelKey);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] px-4 py-12 sm:px-6 flex items-center justify-center">
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-shop/45 to-shopAccent/30 blur-3xl motion-safe:animate-blob-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-shopAccent/25 to-shop/20 blur-3xl motion-safe:animate-blob-drift [animation-delay:-8s]"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-corporate-card sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-shop to-shopAccent text-white shadow-corporate-btn">
              <Box className="h-7 w-7" strokeWidth={2} aria-hidden />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Đặt mật khẩu mới</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Mật khẩu phải có ít nhất 8 ký tự
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={1.5} aria-hidden />
              <p className="text-sm font-medium text-slate-700">
                Mật khẩu đã được đặt lại thành công!
              </p>
              <p className="text-xs text-slate-400">Đang chuyển hướng về trang đăng nhập…</p>
              <Link
                to={ROUTES.adminLogin}
                className="mt-2 inline-block rounded-full bg-gradient-to-r from-shop to-shopAccent px-6 py-2.5 text-sm font-bold text-white shadow-corporate-btn"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" strokeWidth={2} aria-hidden />
                  <div>
                    <p>{error}</p>
                    {(error.includes('hết hạn') || error.includes('không hợp lệ')) && (
                      <Link
                        to={ROUTES.adminForgotPassword}
                        className="mt-1 inline-block text-xs font-semibold text-rose-700 underline"
                      >
                        Yêu cầu link mới
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      Mật khẩu mới
                    </label>
                    {password.length > 0 && (
                      <span className="text-xs font-semibold" style={{ color: strengthColor }}>
                        {pwdStrength.label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-5 w-5 text-slate-400" strokeWidth={2} aria-hidden />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Chữ hoa, thường, số, ký tự đặc biệt"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      className="input-trust py-3 pl-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" strokeWidth={2} aria-hidden />
                      ) : (
                        <Eye className="h-5 w-5" strokeWidth={2} aria-hidden />
                      )}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex gap-1" aria-hidden>
                      {[1, 2, 3].map((seg) => (
                        <div
                          key={seg}
                          className="h-1 flex-1 rounded-full transition-colors"
                          style={{ background: seg <= pwdStrength.meterLevel ? meterFill : '#e5e7eb' }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-5 w-5 text-slate-400" strokeWidth={2} aria-hidden />
                    </div>
                    <input
                      id="confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className="input-trust py-3 pl-11 pr-4"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-shop to-shopAccent py-3 text-sm font-bold text-white shadow-corporate-btn transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-corporate-card-hover disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} aria-hidden />
                      <span>Đang lưu…</span>
                    </>
                  ) : (
                    <span>Đặt mật khẩu mới</span>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 border-t border-slate-100 pt-6 text-center text-xs font-medium text-slate-400">
            © {new Date().getFullYear()} Diecast360
          </p>
        </div>
      </div>
    </div>
  );
};
