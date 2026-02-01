import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from '../ItemsPage.module.css';

interface SearchHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export const SearchHeader = ({ search, onSearchChange }: SearchHeaderProps) => {
  return (
    <div className={styles.actionsBar}>
      <div className={styles.searchWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Tìm kiếm AI (VD: xe đỏ thể thao...)"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <Link to="/admin/items/new" className={styles.addButton}>
        <Plus size={18} />
        <span>Sản phẩm mới</span>
      </Link>
    </div>
  );
};
