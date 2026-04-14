import { Link, useLocation } from 'react-router-dom';
import styles from './preordersPublic.module.css';

type BottomNavigationProps = {
  /** Appended to `/preorders` so shop context survives tab switches (e.g. `?shop_id=...`). */
  preordersSearch?: string;
};

export const BottomNavigation = ({ preordersSearch = '' }: BottomNavigationProps) => {
  const location = useLocation();
  const preordersTo = `/preorders${preordersSearch}`;
  return (
    <nav className={styles.bottomNav}>
      <Link className={location.pathname === '/' ? styles.active : ''} to="/">
        Trang chủ
      </Link>
      <Link
        className={location.pathname === '/preorders' ? styles.active : ''}
        to={preordersTo}
      >
        Đặt trước
      </Link>
      <Link className={location.pathname === '/my-orders' ? styles.active : ''} to="/my-orders">
        Đơn hàng của tôi
      </Link>
    </nav>
  );
};

