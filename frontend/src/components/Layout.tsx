import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  LogIn,
  LogOut,
  Menu,
  Phone,
  ShoppingBag,
  Tags,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useIsSuperAdmin } from '../hooks/useIsSuperAdmin';
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
    navigate('/admin/login');
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

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerRow}>
            <Link to="/" className={styles.brandLink} onClick={closeMobileMenu}>
              <div className={styles.brandMark}>
                360°
              </div>
              <div className={styles.brandCopy}>
                <div className={styles.brandTitle}>Diecast360</div>
                <div className={styles.brandSubtitle}>Mô hình xe thu nhỏ</div>
              </div>
            </Link>

            {/* Shop selector — visible only in admin area */}
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
                  to="/"
                  className={linkClassName(location.pathname === '/')}
                  onClick={closeMobileMenu}
                >
                  <Home size={18} />
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to="/contact"
                  className={linkClassName(location.pathname === '/contact')}
                  onClick={closeMobileMenu}
                >
                  <Phone size={18} />
                  <span>Liên hệ</span>
                </Link>
                <Link
                  to="/preorders"
                  className={linkClassName(location.pathname.startsWith('/preorders'))}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navIconEmoji}>⏳</span>
                  <span>Dat truoc</span>
                </Link>
                <Link
                  to="/my-orders"
                  className={linkClassName(location.pathname.startsWith('/my-orders'))}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navIconEmoji}>🧾</span>
                  <span>Don hang cua toi</span>
                </Link>
                <Link
                  to="/admin/items"
                  className={linkClassName(false)}
                  onClick={closeMobileMenu}
                >
                  <LogIn size={18} />
                  <span>Quản trị</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={linkClassName(false)}
                  onClick={closeMobileMenu}
                >
                  <Home size={18} />
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to="/admin/items"
                  className={linkClassName(location.pathname.startsWith('/admin/items'))}
                  onClick={closeMobileMenu}
                >
                  <ShoppingBag size={18} />
                  <span>Sản phẩm</span>
                </Link>
                <Link
                  to="/admin/preorders"
                  className={linkClassName(location.pathname.startsWith('/admin/preorders'))}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navIconEmoji}>⏳</span>
                  <span>Pre-order</span>
                </Link>
                <Link
                  to="/admin/categories"
                  className={linkClassName(location.pathname.startsWith('/admin/categories'))}
                  onClick={closeMobileMenu}
                >
                  <Tags size={18} />
                  <span>Danh mục</span>
                </Link>
                {isSuperAdmin && (
                  <Link
                    to="/admin/shops"
                    className={linkClassName(location.pathname.startsWith('/admin/shops'))}
                    onClick={closeMobileMenu}
                  >
                    <span className={styles.navIconEmoji}>🏬</span>
                    <span>Quản lý Shops</span>
                  </Link>
                )}
                <Link
                  to="/admin/facebook-posts"
                  className={linkClassName(location.pathname.startsWith('/admin/facebook-posts'))}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.navIconEmoji}>📘</span>
                  <span>Bài đăng FB</span>
                </Link>
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
