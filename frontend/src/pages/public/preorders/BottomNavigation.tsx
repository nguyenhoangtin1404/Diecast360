import { Link, useLocation } from 'react-router-dom';
import styles from './preordersPublic.module.css';

export const BottomNavigation = () => {
  const location = useLocation();
  return (
    <nav className={styles.bottomNav}>
      <Link className={location.pathname === '/' ? styles.active : ''} to="/">
        Trang chu
      </Link>
      <Link className={location.pathname === '/preorders' ? styles.active : ''} to="/preorders">
        Dat truoc
      </Link>
      <Link className={location.pathname === '/my-orders' ? styles.active : ''} to="/my-orders">
        Don hang cua toi
      </Link>
    </nav>
  );
};

