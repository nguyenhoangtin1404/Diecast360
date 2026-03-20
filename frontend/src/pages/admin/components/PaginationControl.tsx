import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../ItemsPage.module.css';

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControl = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlProps) => {
  return (
    <div className={styles.paginationWrapper}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={styles.pageButton}
      >
        <ChevronLeft size={18} />
        <span>Trước</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 12px' }}>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          if (pageNum < 1 || pageNum > totalPages) return null;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`${styles.pageNumber} ${currentPage === pageNum ? styles.pageNumberActive : ''}`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <span className={styles.pageInfo}>
        Trang {currentPage} / {totalPages}
      </span>

      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={styles.pageButton}
      >
        <span>Sau</span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
