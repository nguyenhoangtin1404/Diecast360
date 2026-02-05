import { useState } from 'react';
import { Plus, Search, Sparkles, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from '../ItemsPage.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface SearchHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export const SearchHeader = ({ search, onSearchChange }: SearchHeaderProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/items/export`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'items.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Có lỗi khi xuất CSV. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

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
      <button 
        onClick={handleExportCsv} 
        disabled={isExporting}
        className={styles.exportButton}
      >
        <Download size={18} />
        <span>{isExporting ? 'Đang xuất...' : 'Xuất CSV'}</span>
      </button>
      <Link to="/admin/items/import" className={styles.addButton} style={{ marginRight: '0.75rem', backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}>
        <Sparkles size={18} />
        <span>AI Import</span>
      </Link>
      <Link to="/admin/items/new" className={styles.addButton}>
        <Plus size={18} />
        <span>Sản phẩm mới</span>
      </Link>
    </div>
  );
};
