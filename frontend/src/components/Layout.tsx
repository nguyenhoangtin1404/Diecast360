import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Phone, LogIn, LogOut, User as UserIcon, Tags } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
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
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            }}>
              360°
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1.2' }}>Diecast360</div>
              <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '400' }}>Mô hình xe thu nhỏ</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isAdmin ? (
              <>
                <Link
                  to="/"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: location.pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  }}
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
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: location.pathname === '/contact' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  }}
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
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <LogIn size={18} />
                  <span>Admin</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/admin/items"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: location.pathname.startsWith('/admin/items') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  }}
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
                  <span>Quản lý sản phẩm</span>
                </Link>
                <Link
                  to="/admin/categories"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: location.pathname.startsWith('/admin/categories') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  }}
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
                  to="/"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Home size={18} />
                  <span>Về trang chủ</span>
                </Link>
              </>
            )}

            {user && (
              <>
                <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '0 8px',
                }}>
                  <UserIcon size={18} />
                  <span>{user.full_name || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#ff8a8a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
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
