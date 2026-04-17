import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Home,
  LogIn,
  LogOut,
  Menu,
  Phone,
  PlusCircle,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useIsSuperAdmin } from '../hooks/useIsSuperAdmin';
import {
  ROUTES,
  isAdminItemsImportActive,
  isAdminItemsSectionActive,
  isAdminPreordersCreateActive,
  isAdminPreordersHubActive,
  isAdminPreordersManageActive,
} from '../config/routes';
import { cn } from '../lib/utils';
import ShopSelector from './admin/ShopSelector';

interface LayoutProps {
  children: React.ReactNode;
}

const navLinkBase =
  'inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

const navLinkActive =
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
  const adminEntry = user ? ROUTES.admin.items : ROUTES.adminLogin;

  const navClassName = cn(
    'flex-col items-stretch gap-2 border-t border-slate-200/80 pt-3 pb-2 md:flex md:flex-row md:flex-wrap md:items-center md:gap-1 md:border-t-0 md:pt-0 md:pb-0',
    isMenuOpen ? 'flex' : 'hidden md:flex',
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <header className="sticky top-0 z-[100] border-b border-slate-200/90 bg-white/90 shadow-corporate-card backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-3 md:py-4">
            <Link
              to={ROUTES.home}
              className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              onClick={closeMobileMenu}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-extrabold tracking-tight text-white shadow-corporate-btn transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
                360°
              </div>
              <div className="min-w-0">
                <div className="text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">
                  Diecast360
                </div>
                <div className="truncate text-xs font-medium text-slate-500 sm:text-sm">
                  Mô hình xe thu nhỏ · 1:64
                </div>
              </div>
            </Link>

            {isAdmin && (
              <div className="ml-auto mr-2 flex shrink-0 items-center md:mr-0">
                <ShopSelector />
              </div>
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

          <nav
            id="primary-navigation"
            className={navClassName}
            aria-label={isAdmin ? 'Điều hướng quản trị' : 'Điều hướng chính'}
          >
            {!isAdmin ? (
              <>
                <Link
                  to={ROUTES.home}
                  className={cn(navLinkBase, pathname === ROUTES.home && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <Home size={18} strokeWidth={2} />
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to={ROUTES.contact}
                  className={cn(navLinkBase, pathname === ROUTES.contact && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <Phone size={18} strokeWidth={2} />
                  <span>Liên hệ</span>
                </Link>
                <Link
                  to={ROUTES.preorders}
                  className={cn(navLinkBase, pathname.startsWith(ROUTES.preorders) && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <span className="text-base" aria-hidden>
                    ⏳
                  </span>
                  <span>Đặt trước</span>
                </Link>
                <Link
                  to={ROUTES.myOrders}
                  className={cn(navLinkBase, pathname.startsWith(ROUTES.myOrders) && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <span className="text-base" aria-hidden>
                    🧾
                  </span>
                  <span>Đơn hàng của tôi</span>
                </Link>
                <Link
                  to={adminEntry}
                  className={cn(
                    navLinkBase,
                    'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-corporate-btn hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:text-white hover:shadow-corporate-card-hover',
                  )}
                  onClick={closeMobileMenu}
                >
                  <LogIn size={18} strokeWidth={2} />
                  <span>{user ? 'Quản trị' : 'Đăng nhập quản trị'}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.home}
                  className={cn(navLinkBase, pathname === ROUTES.home && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <Home size={18} strokeWidth={2} />
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to={ROUTES.preorders}
                  className={cn(navLinkBase, pathname.startsWith(ROUTES.preorders) && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <Store size={18} strokeWidth={2} />
                  <span>Đặt trước (khách)</span>
                </Link>
                <Link
                  to={ROUTES.admin.items}
                  className={cn(navLinkBase, isAdminItemsSectionActive(pathname) && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <ShoppingBag size={18} strokeWidth={2} />
                  <span>Sản phẩm</span>
                </Link>
                <Link
                  to={ROUTES.admin.itemsImport}
                  className={cn(navLinkBase, isAdminItemsImportActive(pathname) && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <Sparkles size={18} strokeWidth={2} />
                  <span>Import AI</span>
                </Link>
                <Link
                  to={ROUTES.admin.categories}
                  className={cn(navLinkBase, pathname.startsWith(ROUTES.admin.categories) && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <Tags size={18} strokeWidth={2} />
                  <span>Danh mục</span>
                </Link>
                <Link
                  to={ROUTES.admin.preorders}
                  className={cn(navLinkBase, isAdminPreordersHubActive(pathname) && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <span className="text-base" aria-hidden>
                    ⏳
                  </span>
                  <span>Pre-order</span>
                </Link>
                <Link
                  to={ROUTES.admin.preordersCreate}
                  className={cn(navLinkBase, isAdminPreordersCreateActive(pathname) && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <PlusCircle size={18} strokeWidth={2} />
                  <span>Tạo đợt</span>
                </Link>
                <Link
                  to={ROUTES.admin.preordersManage}
                  className={cn(navLinkBase, isAdminPreordersManageActive(pathname) && navLinkActive)}
                  onClick={closeMobileMenu}
                >
                  <ClipboardList size={18} strokeWidth={2} />
                  <span>QL đặt trước</span>
                </Link>
                <Link
                  to={ROUTES.admin.facebookPosts}
                  className={cn(navLinkBase, pathname.startsWith(ROUTES.admin.facebookPosts) && navLinkActive)}
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
                    className={cn(navLinkBase, pathname.startsWith(ROUTES.admin.shops) && navLinkActive)}
                    onClick={closeMobileMenu}
                  >
                    <span className="text-base" aria-hidden>
                      🏬
                    </span>
                    <span>Quản lý Shops</span>
                  </Link>
                )}
              </>
            )}

            {user && (
              <>
                <div className="mx-1 hidden h-6 w-px bg-slate-200 md:block" aria-hidden />
                <div className="flex min-w-0 max-w-[200px] items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-700 max-md:px-0">
                  <UserIcon size={18} className="shrink-0 text-indigo-600" strokeWidth={2} />
                  <span className="truncate">{user.full_name || user.email}</span>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 max-md:w-full max-md:justify-start"
                  onClick={handleLogout}
                  title="Đăng xuất"
                  aria-label={`Đăng xuất${user.full_name || user.email ? ` khỏi tài khoản ${user.full_name || user.email}` : ''}`}
                >
                  <LogOut size={18} strokeWidth={2} />
                  <span>Đăng xuất</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-indigo-900/20 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 py-10 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6">
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">Diecast360</p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-400">
              Catalog công khai, quản trị đa shop, media & viewer 360° — giao diện Corporate Trust.
            </p>
          </div>
          <p className="text-xs font-medium text-slate-500">© {new Date().getFullYear()} Diecast360</p>
        </div>
      </footer>
    </div>
  );
};
