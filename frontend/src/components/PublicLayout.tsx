import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  LogOut,
  Menu,
  Phone,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../config/routes';
import { cn } from '../lib/utils';
import { usePublicShopContext } from '../hooks/usePublicShopContext';
import { usePublicShopContact } from '../hooks/usePublicShopContact';
import { useDocumentTitleAndFavicon, DEFAULT_DOCUMENT_TITLE } from '../hooks/useDocumentTitleAndFavicon';
import { safeHttpUrlForAttribute } from '../utils/safeHttpUrl';
import { PublicShopMainGate } from './public/PublicShopMainGate';
import { BrandFallbackTile } from './BrandFallbackTile';

interface PublicLayoutProps {
  children: React.ReactNode;
}

/** Trang công khai — menu trên header (ngang desktop, gập mobile). */
const publicNavLinkBase =
  'inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2';

const publicNavLinkActive =
  'bg-shop/10 text-shop ring-1 ring-shop/20 shadow-sm hover:bg-shop/15 active:bg-shop/15 hover:text-shop';

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { effectiveShopId, shopContextReady, publicApiShopReady } = usePublicShopContext();
  const publicShopContact = usePublicShopContact(true);
  const [menuState, setMenuState] = useState({ open: false, pathname: location.pathname });
  const isMenuOpen = menuState.open && menuState.pathname === location.pathname;

  /** Same resolution as catalog (query / env / JWT), not only current URL — keeps nav aligned with VITE_PUBLIC_CATALOG_SHOP_ID. */
  const publicShopNavSuffix = useMemo(() => {
    if (!shopContextReady || !publicApiShopReady) {
      return '';
    }
    return `?shop_id=${encodeURIComponent(effectiveShopId)}`;
  }, [shopContextReady, publicApiShopReady, effectiveShopId]);

  const publicLogoUrl = safeHttpUrlForAttribute(publicShopContact.data?.appearance?.logo_url);
  const publicFaviconUrl = safeHttpUrlForAttribute(publicShopContact.data?.appearance?.favicon_url);
  const publicShopName = publicShopContact.data?.shop?.name?.trim() ?? '';

  const publicBrandTitle = publicShopName || 'Diecast360';
  const publicBrandSubtitle = publicShopName ? 'Catalog công khai' : 'Mô hình xe thu nhỏ · 1:64';

  useDocumentTitleAndFavicon({
    enabled: true,
    title: publicShopName ? `${publicShopName} — Catalog` : DEFAULT_DOCUMENT_TITLE,
    faviconUrl: publicFaviconUrl,
    markerAttr: 'data-shop-branding',
  });

  const renderPublicBrandMark = (size: 'lg' | 'sm') => {
    const isLg = size === 'lg';
    if (publicLogoUrl) {
      return (
        <img
          src={publicLogoUrl}
          alt={publicBrandTitle}
          className={
            isLg
              ? 'h-12 w-12 shrink-0 rounded-xl border border-slate-200/80 bg-white object-contain p-1 shadow-corporate-btn'
              : 'h-9 w-9 shrink-0 rounded-lg border border-slate-200/80 bg-white object-contain p-0.5 shadow-corporate-btn'
          }
        />
      );
    }
    return (
      <BrandFallbackTile
        className={
          isLg
            ? 'h-12 w-12 rounded-xl text-lg transition-transform duration-200 ease-out group-hover:-translate-y-0.5'
            : 'h-9 w-9 rounded-lg text-xs'
        }
      />
    );
  };

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

  const sharedFooter = (
    <footer className="border-t border-shop/20 bg-gradient-to-br from-shop via-slate-900 to-slate-950 py-10 text-slate-300">
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

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <header className="sticky top-0 z-[100] border-b border-slate-200/90 bg-white/90 shadow-corporate-card backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-3 md:py-4">
            <Link
              to={`${ROUTES.home}${publicShopNavSuffix}`}
              className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2"
              onClick={closeMobileMenu}
            >
              {renderPublicBrandMark('lg')}
              <div className="min-w-0">
                <div className="text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">{publicBrandTitle}</div>
                <div className="truncate text-xs font-medium text-slate-500 sm:text-sm">{publicBrandSubtitle}</div>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {user && (
                <>
                  <div className="flex max-w-[min(12rem,42vw)] min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-700 sm:max-w-[14rem] sm:px-3">
                    <UserIcon size={18} className="shrink-0 text-shop" strokeWidth={2} />
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
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-shop/30 hover:bg-shop/10 active:bg-shop/15 hover:text-shop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2 md:hidden"
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
            <Link
              to={`${ROUTES.home}${publicShopNavSuffix}`}
              className={cn(publicNavLinkBase, pathname === ROUTES.home && publicNavLinkActive)}
              onClick={closeMobileMenu}
            >
              <Home size={18} strokeWidth={2} />
              <span>Trang chủ</span>
            </Link>
            <Link
              to={`${ROUTES.preorders}${publicShopNavSuffix}`}
              className={cn(publicNavLinkBase, pathname.startsWith(ROUTES.preorders) && publicNavLinkActive)}
              onClick={closeMobileMenu}
            >
              <span className="text-base" aria-hidden>
                ⏳
              </span>
              <span>Đặt trước</span>
            </Link>
            <Link
              to={`${ROUTES.myOrders}${publicShopNavSuffix}`}
              className={cn(publicNavLinkBase, pathname.startsWith(ROUTES.myOrders) && publicNavLinkActive)}
              onClick={closeMobileMenu}
            >
              <span className="text-base" aria-hidden>
                🧾
              </span>
              <span>Đơn hàng của tôi</span>
            </Link>
            <Link
              to={`${ROUTES.contact}${publicShopNavSuffix}`}
              className={cn(publicNavLinkBase, pathname === ROUTES.contact && publicNavLinkActive)}
              onClick={closeMobileMenu}
            >
              <Phone size={18} strokeWidth={2} />
              <span>Liên hệ</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <PublicShopMainGate>{children}</PublicShopMainGate>
      </main>
      {sharedFooter}
    </div>
  );
};
