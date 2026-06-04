import { useLocation } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { AdminLayout } from './AdminLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (!isAdmin) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  return <AdminLayout>{children}</AdminLayout>;
};
