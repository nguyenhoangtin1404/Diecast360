import { Home, Layers, ShoppingBag, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import styles from './preordersPublic.module.css';

type BottomNavigationProps = {
  /** Appended to `/preorders` so shop context survives tab switches (e.g. `?shop_id=...`). */
  preordersSearch?: string;
};

export const BottomNavigation = ({ preordersSearch = '' }: BottomNavigationProps) => {
  const location = useLocation();
  const preordersTo = `${ROUTES.preorders}${preordersSearch}`;

  const navItem = (path: string) => location.pathname === path;

  return (
    <nav className={styles.bottomNav} aria-label="Điều hướng chính">
      <Link
        to={ROUTES.home}
        aria-current={navItem(ROUTES.home) ? 'page' : undefined}
        className={navItem(ROUTES.home) ? styles.active : ''}
      >
        <Home aria-hidden />
        Trang chủ
      </Link>
      <Link
        to={preordersTo}
        aria-current={navItem(ROUTES.preorders) ? 'page' : undefined}
        className={navItem(ROUTES.preorders) ? styles.active : ''}
      >
        <Layers aria-hidden />
        Đặt trước
      </Link>
      <Link
        to={`${ROUTES.myOrders}${preordersSearch}`}
        aria-current={navItem(ROUTES.myOrders) ? 'page' : undefined}
        className={navItem(ROUTES.myOrders) ? styles.active : ''}
      >
        <ShoppingBag aria-hidden />
        Đơn hàng của tôi
      </Link>
      <Link
        to={ROUTES.contact}
        aria-current={navItem(ROUTES.contact) ? 'page' : undefined}
        className={navItem(ROUTES.contact) ? styles.active : ''}
      >
        <MessageCircle aria-hidden />
        Liên hệ
      </Link>
    </nav>
  );
};
