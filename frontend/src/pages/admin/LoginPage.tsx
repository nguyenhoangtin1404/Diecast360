import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, LogIn, AlertCircle, Box, Loader2, Shield } from 'lucide-react';
import type { ApiErrorResponse } from '../../types/item.types';
import { ROUTES } from '../../config/routes';

const defaultLoginError = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';

function getLoginErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorResponse>(err)) {
    return err.response?.data?.message || defaultLoginError;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) {
      return m;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return defaultLoginError;
}

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(ROUTES.admin.reports);
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-indigo-400/35 to-violet-500/30 blur-3xl motion-safe:animate-blob-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-violet-500/25 to-indigo-300/20 blur-3xl motion-safe:animate-blob-drift [animation-delay:-8s]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 shadow-corporate-card">
            <Shield className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Khu vực quản trị
          </div>
          <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Đăng nhập{' '}
            <span className="text-gradient-trust">Diecast360</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Giao diện Corporate Trust — bảo mật cookie HttpOnly, đa shop, và trải nghiệm quản trị nhất quán với catalog công khai.
          </p>
          <ul className="mt-8 space-y-3 text-sm font-medium text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden />
              Quản lý sản phẩm, media & 360°
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden />
              Pre-order & bài đăng Facebook
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Sẵn sàng cho đội vận hành thực tế
            </li>
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-corporate-card transition-shadow duration-200 hover:shadow-corporate-card-hover sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-corporate-btn">
                <Box className="h-7 w-7" strokeWidth={2} aria-hidden />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Chào mừng trở lại</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Nhập email và mật khẩu quản trị</p>
            </div>

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
                    className="input-trust py-3 pl-11 pr-4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-5 w-5 text-slate-400" strokeWidth={2} aria-hidden />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-trust py-3 pl-11 pr-4"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-corporate-btn transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-corporate-card-hover disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} aria-hidden />
                    <span>Đang đăng nhập…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} aria-hidden />
                    <span>Đăng nhập</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 border-t border-slate-100 pt-6 text-center text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} Diecast360 · Corporate Trust
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
