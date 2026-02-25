import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { ExternalLink, Eye, Search } from 'lucide-react';
import type { AdminItem, Pagination } from '../../types/item.types';
import { ITEM_STATUS_LABELS } from '../../constants/item';
import styles from './FacebookPostsPage.module.css';

export const FacebookPostsPage = () => {
  const navigate = useNavigate();
  const [fbFilter, setFbFilter] = useState<'all' | 'posted' | 'not_posted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['fb-posts', fbFilter, debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('page_size', '20');
      if (fbFilter !== 'all') params.set('fb_status', fbFilter);
      if (debouncedSearch) params.set('q', debouncedSearch);
      const response = await apiClient.get(`/items?${params.toString()}`);
      return response.data || response;
    },
  });

  const items: AdminItem[] = data?.items || [];
  const pagination: Pagination = data?.pagination || { page: 1, page_size: 20, total: 0, total_pages: 0 };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>📘 Bài đăng Facebook</h1>
        <p className={styles.subtitle}>Quản lý tất cả bài đăng Facebook của sản phẩm</p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${fbFilter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => { setFbFilter('all'); setPage(1); }}
          >
            Tất cả
          </button>
          <button
            className={`${styles.filterBtn} ${fbFilter === 'posted' ? styles.filterBtnActive : ''}`}
            onClick={() => { setFbFilter('posted'); setPage(1); }}
          >
            ✅ Đã đăng
          </button>
          <button
            className={`${styles.filterBtn} ${fbFilter === 'not_posted' ? styles.filterBtnActive : ''}`}
            onClick={() => { setFbFilter('not_posted'); setPage(1); }}
          >
            ⏳ Chưa đăng
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Tìm sản phẩm..."
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <span>Tổng: <strong>{pagination.total}</strong> sản phẩm</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p>Không có sản phẩm nào.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Hình ảnh</th>
                <th className={styles.th}>Tên sản phẩm</th>
                <th className={styles.th}>Trạng thái SP</th>
                <th className={styles.th}>Link Facebook</th>
                <th className={styles.th}>Ngày đăng</th>
                <th className={styles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={styles.tr}>
                  <td className={styles.td}>
                    {item.cover_image_url ? (
                      <img
                        src={item.cover_image_url}
                        alt={item.name}
                        className={styles.thumbnail}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={styles.noImage}>—</div>
                    )}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.itemName}>{item.name}</div>
                    {item.price && (
                      <div className={styles.itemPrice}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                      </div>
                    )}
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    <span
                      className={styles.statusBadge}
                      style={{ color: ITEM_STATUS_LABELS[item.status]?.color || '#666' }}
                    >
                      {ITEM_STATUS_LABELS[item.status]?.text || item.status}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    {item.fb_post_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <a
                          href={item.fb_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.fbLink}
                        >
                          <ExternalLink size={14} />
                          Mở bài FB
                        </a>
                        {(item.fb_posts_count ?? 0) > 1 && (
                          <span style={{
                            fontSize: '11px',
                            background: '#1877F2',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '1px 6px',
                            fontWeight: '600',
                          }}>
                            {item.fb_posts_count}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={styles.notPosted}>Chưa đăng</span>
                    )}
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    {item.fb_posted_at ? (
                      <span className={styles.dateText}>
                        {new Date(item.fb_posted_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className={styles.notPosted}>—</span>
                    )}
                  </td>
                  <td className={`${styles.td} ${styles.tdCenter}`}>
                    <div className={styles.actions}>
                      <button
                        onClick={() => navigate(`/admin/items/${item.id}?section=social-selling`)}
                        className={styles.actionBtn}
                        title="Xem & chia sẻ"
                      >
                        <Eye size={16} />
                      </button>
                      {item.fb_post_url && (
                        <a
                          href={item.fb_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionBtnFb}
                          title="Mở Facebook"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className={styles.pageBtn}
          >
            ← Trước
          </button>
          <span className={styles.pageInfo}>
            Trang {pagination.page} / {pagination.total_pages}
          </span>
          <button
            disabled={page >= pagination.total_pages}
            onClick={() => setPage(p => p + 1)}
            className={styles.pageBtn}
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
};
