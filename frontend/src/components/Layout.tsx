import { useEffect, useState } from 'react';
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
import { useIsMobile } from '../hooks/useIsMobile';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const linkBaseStyle = (active = false) => ({
    padding: isMobile ? '12px 14px' : '10px 16px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    backgroundColor: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
    minHeight: isMobile ? '44px' : undefined,
  });

  const navContainerStyle = isMobile
    ? {
        display: isMenuOpen ? 'flex' : 'none',
        flexDirection: 'column' as const,
        alignItems: 'stretch',
        gap: '10px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.12)',
      }
    : {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                flexShrink: 0,
              }}>
                360°
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', lineHeight: '1.2' }}>Diecast360</div>
                <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '400', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>Mô hình xe thu nhỏ</div>
              </div>
            </Link>

            {isMobile && (
              <button
                type="button"
                onClick={() => setIsMenuOpen((value) => !value)}
                aria-label={isMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
                aria-expanded={isMenuOpen}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>

          <nav style={navContainerStyle}>
            {!isAdmin ? (
              <>
                <Link
                  to="/"
                  style={linkBaseStyle(location.pathname === '/')}
                  onMouseEnter={(e) => {
                    if (location.pathname !== '/') {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== '/') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Home size={18} />
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to="/contact"
                  style={linkBaseStyle(location.pathname === '/contact')}
                  onMouseEnter={(e) => {
                    if (location.pathname !== '/contact') {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== '/contact') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Phone size={18} />
                  <span>Liên hệ</span>
                </Link>
                <Link
                  to="/admin/items"
                  style={linkBaseStyle(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <LogIn size={18} />
                  <span>Quản trị</span>
                </Link>
              </>
            ) : (
              <>

              <Link
                  to="/"
                  style={linkBaseStyle(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Home size={18} />
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to="/admin/items"
                  style={linkBaseStyle(location.pathname.startsWith('/admin/items'))}
                  onMouseEnter={(e) => {
                    if (!location.pathname.startsWith('/admin/items')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!location.pathname.startsWith('/admin/items')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <ShoppingBag size={18} />
                  <span>Sản phẩm</span>
                </Link>
                <Link
                  to="/admin/categories"
                  style={linkBaseStyle(location.pathname.startsWith('/admin/categories'))}
                  onMouseEnter={(e) => {
                    if (!location.pathname.startsWith('/admin/categories')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!location.pathname.startsWith('/admin/categories')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Tags size={18} />
                  <span>Danh mục</span>
                </Link>
                <Link
                  to="/admin/facebook-posts"
                  style={linkBaseStyle(location.pathname.startsWith('/admin/facebook-posts'))}
                  onMouseEnter={(e) => {
                    if (!location.pathname.startsWith('/admin/facebook-posts')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!location.pathname.startsWith('/admin/facebook-posts')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px' }}>📘</span>
                  <span>Bài đăng FB</span>
                </Link>
                
              </>
            )}

            {user && (
              <>
                <div style={{
                  width: isMobile ? '100%' : '1px',
                  height: isMobile ? '1px' : '24px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  margin: isMobile ? '2px 0' : '0 4px',
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: isMobile ? '4px 0' : '0 8px',
                  minWidth: 0,
                }}>
                  <UserIcon size={18} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: isMobile ? '12px 14px' : '8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#ff8a8a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'flex-start' : 'center',
                    gap: isMobile ? '8px' : 0,
                    transition: 'all 0.2s',
                    minHeight: isMobile ? '44px' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 138, 138, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                  {isMobile && <span>Đăng xuất</span>}
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '24px',
        textAlign: 'center',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
            © 2025 Diecast360. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
