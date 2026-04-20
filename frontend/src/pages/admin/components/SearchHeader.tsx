import { useState } from 'react';
import { Plus, Search, Sparkles, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import styles from '../ItemsPage.module.css';
import { downloadFile } from '../../../api/client';
import { ROUTES } from '../../../config/routes';

interface SearchHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export const SearchHeader = ({ search, onSearchChange }: SearchHeaderProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await downloadFile('/items/export');

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
        <Search size={18} className={cn(styles.searchIcon, 'text-slate-400')} strokeWidth={2} />
        <input
          type="text"
          placeholder="Tìm kiếm AI (VD: xe đỏ thể thao...)"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn('input-trust py-2.5 pl-10 pr-3')}
        />
      </div>
      <Link to={`${ROUTES.admin.items}/new`} className={styles.addButton}>
        <Plus size={18} strokeWidth={2} />
        <span>Thêm sản phẩm</span>
      </Link>
      <Link to={ROUTES.admin.itemsImport} className={styles.aiImportButton}>
        <Sparkles size={18} strokeWidth={2} />
        <span>Thêm sản phẩm (AI)</span>
      </Link>
      <button
        type="button"
        onClick={handleExportCsv}
        disabled={isExporting}
        className={styles.exportButton}
      >
        <Download size={18} strokeWidth={2} />
        <span>{isExporting ? 'Đang xuất...' : 'Xuất dữ liệu'}</span>
      </button>
    </div>
  );
};
