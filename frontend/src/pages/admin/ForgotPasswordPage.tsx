import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2, Box } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ROUTES } from '../../config/routes';
import type { ApiErrorResponse } from '../../types/item.types';

function getErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorResponse>(err)) {
    return err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="text-xl font-bold text-slate-900">Quên mật khẩu</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Nhập email để nhận link đặt lại mật khẩu
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={1.5} aria-hidden />
              <p className="text-sm font-medium text-slate-700">
                Nếu email <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong ít phút.
              </p>
              <p className="text-xs text-slate-400">Kiểm tra cả hộp thư spam nếu không thấy email.</p>
              <Link
                to={ROUTES.adminLogin}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-shop hover:underline"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" strokeWidth={2} aria-hidden />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="h-5 w-5 text-slate-400" strokeWidth={2} aria-hidden />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
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
                      <span>Đang gửi…</span>
                    </>
                  ) : (
                    <span>Gửi link đặt lại mật khẩu</span>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center">
                <Link
                  to={ROUTES.adminLogin}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-shop hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Quay lại đăng nhập
                </Link>
              </p>
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
