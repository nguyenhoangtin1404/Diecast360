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
import ShopSelector from './admin/ShopSelector';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

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

  const navClassName = `${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`;
  const linkClassName = (active = false) =>
    active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  const pathname = location.pathname;
  const adminEntry = user ? ROUTES.admin.items : ROUTES.adminLogin;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerRow}>
            <Link to={ROUTES.home} className={styles.brandLink} onClick={closeMobileMenu}>
              <div className={styles.brandMark}>
                360°
              </div>
              <div className={styles.brandCopy}>
                <div className={styles.brandTitle}>Diecast360</div>
                <div className={styles.brandSubtitle}>Mô hình xe thu nhỏ</div>
              </div>
            </Link>

            {isAdmin && (
              <div style={{ marginLeft: 'auto', marginRight: '8px' }}>
                <ShopSelector />
              </div>
            )}

            <button
              type="button"
              className={styles.menuButton}
              onClick={toggleMobileMenu}
              aria-label={isMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
              aria-expanded={isMenuOpen}
              aria-controls="primary-navigation"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav id="primary-navigation" className={navClassName} aria-label={isAdmin ? 'Điều hướng quản trị' : 'Điều hướng chính'}>
            {!isAdmin ? (
              <>
                <Link
                  to={ROUTES.home}
                  className={linkClassName(pathname === ROUTES.home)}
                  onClick={closeMobileMenu}
                >
                  <Home size={18} />
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to={ROUTES.contact}
                  className={linkClassName(pathname === ROUTES.contact)}
                  onClick={closeMobileMenu}
                >
                  <Phone size={18} />
                  <span>Liên hệ</span>
                </Link>
                <Link
                  to={ROUTES.preorders}
                  className={linkClassName(pathname.startsWith(ROUTES.preorders))}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navIconEmoji}>⏳</span>
                  <span>Đặt trước</span>
                </Link>
                <Link
                  to={ROUTES.myOrders}
                  className={linkClassName(pathname.startsWith(ROUTES.myOrders))}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navIconEmoji}>🧾</span>
                  <span>Đơn hàng của tôi</span>
                </Link>
                <Link
                  to={adminEntry}
                  className={linkClassName(false)}
                  onClick={closeMobileMenu}
                >
                  <LogIn size={18} />
                  <span>{user ? 'Quản trị' : 'Đăng nhập quản trị'}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.home}
                  className={linkClassName(pathname === ROUTES.home)}
                  onClick={closeMobileMenu}
                >
                  <Home size={18} />
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to={ROUTES.preorders}
                  className={linkClassName(pathname.startsWith(ROUTES.preorders))}
                  onClick={closeMobileMenu}
                >
                  <Store size={18} />
                  <span>Đặt trước (khách)</span>
                </Link>
                <Link
                  to={ROUTES.admin.items}
                  className={linkClassName(isAdminItemsSectionActive(pathname))}
                  onClick={closeMobileMenu}
                >
                  <ShoppingBag size={18} />
                  <span>Sản phẩm</span>
                </Link>
                <Link
                  to={ROUTES.admin.itemsImport}
                  className={linkClassName(isAdminItemsImportActive(pathname))}
                  onClick={closeMobileMenu}
                >
                  <Sparkles size={18} />
                  <span>Import AI</span>
                </Link>
                <Link
                  to={ROUTES.admin.categories}
                  className={linkClassName(pathname.startsWith(ROUTES.admin.categories))}
                  onClick={closeMobileMenu}
                >
                  <Tags size={18} />
                  <span>Danh mục</span>
                </Link>
                <Link
                  to={ROUTES.admin.preorders}
                  className={linkClassName(isAdminPreordersHubActive(pathname))}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navIconEmoji}>⏳</span>
                  <span>Pre-order</span>
                </Link>
                <Link
                  to={ROUTES.admin.preordersCreate}
                  className={linkClassName(isAdminPreordersCreateActive(pathname))}
                  onClick={closeMobileMenu}
                >
                  <PlusCircle size={18} />
                  <span>Tạo đợt</span>
                </Link>
                <Link
                  to={ROUTES.admin.preordersManage}
                  className={linkClassName(isAdminPreordersManageActive(pathname))}
                  onClick={closeMobileMenu}
                >
                  <ClipboardList size={18} />
                  <span>QL đặt trước</span>
                </Link>
                <Link
                  to={ROUTES.admin.facebookPosts}
                  className={linkClassName(pathname.startsWith(ROUTES.admin.facebookPosts))}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navIconEmoji}>📘</span>
                  <span>Bài đăng FB</span>
                </Link>
                {isSuperAdmin && (
                  <Link
                    to={ROUTES.admin.shops}
                    className={linkClassName(pathname.startsWith(ROUTES.admin.shops))}
                    onClick={closeMobileMenu}
                  >
                    <span className={styles.navIconEmoji}>🏬</span>
                    <span>Quản lý Shops</span>
                  </Link>
                )}
              </>
            )}

            {user && (
              <>
                <div className={styles.navSeparator} />
                <div className={styles.userInfo}>
                  <UserIcon size={18} className={styles.userIcon} />
                  <span className={styles.userText}>{user.full_name || user.email}</span>
                </div>
                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={handleLogout}
                  title="Đăng xuất"
                  aria-label={`Đăng xuất${user.full_name || user.email ? ` khỏi tài khoản ${user.full_name || user.email}` : ''}`}
                >
                  <LogOut size={18} />
                  <span className={styles.logoutLabel}>Đăng xuất</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerText}>© 2025 Diecast360. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
