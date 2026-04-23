import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChartNoAxesColumn,
  Home,
  LogOut,
  Menu,
  Phone,
  ShoppingBag,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useIsSuperAdmin } from '../hooks/useIsSuperAdmin';
import {
  ROUTES,
  isAdminItemsImportActive,
  isAdminReportsActive,
  isAdminItemsSectionActive,
  isAdminPreordersHubActive,
} from '../config/routes';
import { cn } from '../lib/utils';
import ShopSelector from './admin/ShopSelector';

interface LayoutProps {
  children: React.ReactNode;
}

/** Trang công khai — menu trên header (ngang desktop, gập mobile). */
const publicNavLinkBase =
  'inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

const publicNavLinkActive =
  'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 shadow-sm hover:bg-indigo-50/90 hover:text-indigo-800';

/** Admin — menu cột trong sidebar trái. */
const adminSidebarNavLinkBase =
  'flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

const adminSidebarNavLinkActive =
  'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 shadow-sm hover:bg-indigo-50/90 hover:text-indigo-800';

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');
  const isSuperAdmin = useIsSuperAdmin();
  const [menuState, setMenuState] = useState({ open: false, pathname: location.pathname });
  const isMenuOpen = menuState.open && menuState.pathname === location.pathname;

  const handleLogout = async () => {
    setMenuState({ open: false, pathname: location.pathname });
    await logout();
    navigate(ROUTES.adminLogin);
  };

  const toggleMobileMenu = () => {
    setMenuState((current) => ({
      open: !(current.open && current.pathname === location.pathname),
      pathname: location.pathname,
    }));
  };

  const closeMobileMenu = () => {
    setMenuState({ open: false, pathname: location.pathname });
  };

  const pathname = location.pathname;

  const publicHeaderNavClassName = cn(
    'flex-col items-stretch gap-2 border-t border-slate-200/80 pt-3 pb-2 md:flex md:flex-row md:flex-wrap md:items-center md:gap-1 md:border-t-0 md:pt-0 md:pb-0',
    isMenuOpen ? 'flex' : 'hidden md:flex',
  );

  const renderPublicHeaderNav = () => (
    <>
      <Link
        to={ROUTES.home}
        className={cn(publicNavLinkBase, pathname === ROUTES.home && publicNavLinkActive)}
        onClick={closeMobileMenu}
      >
        <Home size={18} strokeWidth={2} />
        <span>Trang chủ</span>
      </Link>
      <Link
        to={ROUTES.preorders}
        className={cn(publicNavLinkBase, pathname.startsWith(ROUTES.preorders) && publicNavLinkActive)}
        onClick={closeMobileMenu}
      >
        <span className="text-base" aria-hidden>
          ⏳
        </span>
        <span>Đặt trước</span>
      </Link>
      <Link
        to={ROUTES.myOrders}
        className={cn(publicNavLinkBase, pathname.startsWith(ROUTES.myOrders) && publicNavLinkActive)}
        onClick={closeMobileMenu}
      >
        <span className="text-base" aria-hidden>
          🧾
        </span>
        <span>Đơn hàng của tôi</span>
      </Link>
      <Link
        to={ROUTES.contact}
        className={cn(publicNavLinkBase, pathname === ROUTES.contact && publicNavLinkActive)}
        onClick={closeMobileMenu}
      >
        <Phone size={18} strokeWidth={2} />
        <span>Liên hệ</span>
      </Link>
    </>
  );

  const renderAdminSidebarNav = () => (
    <>
      <Link
        to={ROUTES.admin.reports}
        className={cn(adminSidebarNavLinkBase, isAdminReportsActive(pathname) && adminSidebarNavLinkActive)}
        onClick={closeMobileMenu}
      >
        <ChartNoAxesColumn size={18} strokeWidth={2} />
        <span>Báo cáo</span>
      </Link>
      <Link
        to={ROUTES.admin.items}
        className={cn(adminSidebarNavLinkBase, isAdminItemsSectionActive(pathname) && adminSidebarNavLinkActive)}
        onClick={closeMobileMenu}
      >
        <ShoppingBag size={18} strokeWidth={2} />
        <span>Sản phẩm</span>
      </Link>
      <Link
        to={ROUTES.admin.itemsImport}
        className={cn(adminSidebarNavLinkBase, isAdminItemsImportActive(pathname) && adminSidebarNavLinkActive)}
        onClick={closeMobileMenu}
      >
        <Sparkles size={18} strokeWidth={2} />
        <span>AI tool</span>
      </Link>
      <Link
        to={ROUTES.admin.preorders}
        className={cn(adminSidebarNavLinkBase, isAdminPreordersHubActive(pathname) && adminSidebarNavLinkActive)}
        onClick={closeMobileMenu}
      >
        <span className="text-base" aria-hidden>
          ⏳
        </span>
        <span>Pre-order</span>
      </Link>
      <Link
        to={ROUTES.admin.facebookPosts}
        className={cn(
          adminSidebarNavLinkBase,
          pathname.startsWith(ROUTES.admin.facebookPosts) && adminSidebarNavLinkActive,
        )}
        onClick={closeMobileMenu}
      >
        <span className="text-base" aria-hidden>
          📘
        </span>
        <span>Bài đăng FB</span>
      </Link>
      {isSuperAdmin && (
        <Link
          to={ROUTES.admin.shops}
          className={cn(adminSidebarNavLinkBase, pathname.startsWith(ROUTES.admin.shops) && adminSidebarNavLinkActive)}
          onClick={closeMobileMenu}
        >
          <span className="text-base" aria-hidden>
            🏬
          </span>
          <span>Quản lý shop</span>
        </Link>
      )}
    </>
  );

  const sharedFooter = (
    <footer className="border-t border-indigo-900/20 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 py-10 text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6">
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">Diecast360</p>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-400">
            Catalog công khai, quản trị đa shop, media & viewer 360°.
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">© {new Date().getFullYear()} Diecast360</p>
      </div>
    </footer>
  );

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
        <header className="sticky top-0 z-[100] border-b border-slate-200/90 bg-white/90 shadow-corporate-card backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6">
            <div className="flex items-center justify-between gap-3 py-3 md:py-4">
              <Link
                to={ROUTES.home}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                onClick={closeMobileMenu}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-extrabold tracking-tight text-white shadow-corporate-btn transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
                  360°
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">Diecast360</div>
                  <div className="truncate text-xs font-medium text-slate-500 sm:text-sm">
                    Mô hình xe thu nhỏ · 1:64
                  </div>
                </div>
              </Link>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {user && (
                  <>
                    <div className="flex max-w-[min(12rem,42vw)] min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-700 sm:max-w-[14rem] sm:px-3">
                      <UserIcon size={18} className="shrink-0 text-indigo-600" strokeWidth={2} />
                      <span className="truncate">{user.full_name || user.email}</span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 sm:gap-2 sm:px-3 sm:text-sm"
                      onClick={handleLogout}
                      title="Đăng xuất"
                      aria-label={`Đăng xuất${user.full_name || user.email ? ` khỏi tài khoản ${user.full_name || user.email}` : ''}`}
                    >
                      <LogOut size={18} strokeWidth={2} />
                      <span>Đăng xuất</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 md:hidden"
                  onClick={toggleMobileMenu}
                  aria-label={isMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
                  aria-expanded={isMenuOpen}
                  aria-controls="primary-navigation"
                >
                  {isMenuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <nav
              id="primary-navigation"
              className={cn(publicHeaderNavClassName, 'md:justify-center')}
              aria-label="Điều hướng chính"
            >
              {renderPublicHeaderNav()}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>
        {sharedFooter}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-[#F8FAFC] md:flex-row">
      {isMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] md:hidden"
          aria-label="Đóng menu"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-50 flex w-[min(17.5rem,88vw)] flex-col border-r border-slate-200/90 bg-white/95 shadow-corporate-card backdrop-blur-md transition-transform duration-200 ease-out md:static md:z-0 md:h-auto md:min-h-screen md:w-64 md:max-w-[16rem] md:shrink-0 md:translate-x-0 md:shadow-sm',
          isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        aria-label="Menu quản trị"
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200/80 p-4">
          <Link
            to={ROUTES.home}
            className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            onClick={closeMobileMenu}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-base font-extrabold tracking-tight text-white shadow-corporate-btn transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
              360°
            </div>
            <div className="min-w-0">
              <div className="text-base font-extrabold tracking-tight text-slate-900">Diecast360</div>
              <div className="truncate text-xs font-medium text-slate-500">Mô hình xe thu nhỏ · 1:64</div>
            </div>
          </Link>

          <div className="min-w-0">
            <ShopSelector />
          </div>
          {user && (
            <div className="hidden md:grid md:grid-cols-[minmax(0,9fr)_minmax(0,1fr)] md:items-center md:gap-1.5 md:rounded-lg md:border md:border-slate-200 md:bg-slate-50/70 md:px-2 md:py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <UserIcon size={16} className="shrink-0 text-indigo-600" strokeWidth={2} aria-hidden />
                <span className="truncate text-sm font-medium text-slate-700">{user.full_name || user.email}</span>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-full items-center justify-center rounded-md text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-inset"
                onClick={handleLogout}
                title="Đăng xuất"
                aria-label={`Đăng xuất${user.full_name || user.email ? ` khỏi tài khoản ${user.full_name || user.email}` : ''}`}
              >
                <LogOut size={16} strokeWidth={2} aria-hidden />
              </button>
            </div>
          )}
        </div>

        <nav
          id="primary-navigation"
          className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3"
          aria-label="Điều hướng quản trị"
        >
          {renderAdminSidebarNav()}
        </nav>
        {user && (
          <div className="border-t border-slate-200/80 p-3">
            <button
              type="button"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 md:hidden"
              onClick={handleLogout}
            >
              <LogOut size={16} strokeWidth={2} />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </aside>

      <div className={cn('flex min-h-screen min-w-0 flex-1 flex-col', user && 'pt-10')}>
        {user && (
          <div
            className="fixed left-0 right-0 top-0 z-[200] flex h-10 w-full items-center justify-end border-b border-slate-200/90 bg-white pr-2 shadow-sm md:hidden"
            role="region"
            aria-label="Tài khoản quản trị"
          >
            <div className="grid h-full min-h-0 w-[min(26rem,94vw)] shrink-0 grid-cols-[minmax(0,4fr)_minmax(0,2fr)] items-center gap-1 pl-1">
              <div className="flex min-h-0 min-w-0 items-center gap-1.5 overflow-hidden">
                <UserIcon className="h-4 w-4 shrink-0 text-indigo-600" strokeWidth={2} aria-hidden />
                <span className="min-w-0 truncate text-sm font-medium leading-snug text-slate-700">
                  {user.full_name || user.email}
                </span>
              </div>
              <button
                type="button"
                className="inline-flex h-full min-h-0 w-full min-w-0 shrink-0 items-center justify-center gap-1 border-l border-slate-200/70 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-inset"
                onClick={handleLogout}
                title="Đăng xuất"
                aria-label={`Đăng xuất${user.full_name || user.email ? ` khỏi tài khoản ${user.full_name || user.email}` : ''}`}
              >
                <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/90 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md md:hidden">
          <Link
            to={ROUTES.home}
            className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            onClick={closeMobileMenu}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-extrabold text-white shadow-corporate-btn">
              360°
            </div>
            <span className="truncate text-base font-extrabold tracking-tight text-slate-900">Diecast360</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            onClick={toggleMobileMenu}
            aria-label={isMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
          >
            {isMenuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </header>

        <main className="flex-1">{children}</main>
        {sharedFooter}
      </div>
    </div>
  );
};
