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
  return (
    <nav className={styles.bottomNav}>
      <Link className={location.pathname === ROUTES.home ? styles.active : ''} to={ROUTES.home}>
        Trang chủ
      </Link>
      <Link
        className={location.pathname === ROUTES.preorders ? styles.active : ''}
        to={preordersTo}
      >
        Đặt trước
      </Link>
      <Link
        className={location.pathname === ROUTES.myOrders ? styles.active : ''}
        to={`${ROUTES.myOrders}${preordersSearch}`}
      >
        Đơn hàng của tôi
      </Link>
      <Link className={location.pathname === ROUTES.contact ? styles.active : ''} to={ROUTES.contact}>
        Liên hệ
      </Link>
    </nav>
  );
};

