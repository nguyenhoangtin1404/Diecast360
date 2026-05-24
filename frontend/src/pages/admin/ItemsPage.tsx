import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { API_CONFIG } from '../../config/api';
import { useDebounce } from '../../hooks/useDebounce';
import type { ItemsResponse } from '../../types/item.types';
import type { ApiResponse } from '../../types/category';
import styles from './ItemsPage.module.css';

// Sub-components
import { SearchHeader } from './components/SearchHeader';
import { ItemsTable } from './components/ItemsTable';
import { PaginationControl } from './components/PaginationControl';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export const ItemsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [preorderOpenFilter, setPreorderOpenFilter] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', page, debouncedSearch, preorderOpenFilter],
    queryFn: async () => {
      if (debouncedSearch && API_CONFIG.ADMIN_SEMANTIC_SEARCH_ENABLED && !preorderOpenFilter) {
        const params = new URLSearchParams({ q: debouncedSearch });
        const response = await apiClient.get(`/items/search?${params.toString()}`) as ApiResponse<ItemsResponse>;
        return response.data;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });

      if (debouncedSearch) {
        params.set('q', debouncedSearch);
      }

      if (preorderOpenFilter) {
        params.set('preorder_open', 'true');
      }

      const response = await apiClient.get(`/items?${params.toString()}`) as ApiResponse<ItemsResponse>;
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      return apiClient.patch(`/items/${id}`, { is_public: !isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const closePreorderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/items/${id}/close-preorder`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const reopenPreorderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/items/${id}/reopen-preorder`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Có lỗi khi xóa sản phẩm');
    }
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    try {
      await togglePublicMutation.mutateAsync({ id, isPublic });
    } catch (error) {
      console.error('Error toggling public:', error);
      alert('Có lỗi khi thay đổi trạng thái công khai');
    }
  };

  const handleClosePreorder = async (id: string): Promise<void> => {
    try {
      await closePreorderMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error closing preorder:', error);
      alert('Có lỗi khi đóng preorder');
    }
  };

  const handleReopenPreorder = async (id: string): Promise<void> => {
    try {
      await reopenPreorderMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error reopening preorder:', error);
      alert('Có lỗi khi mở lại preorder');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-shop/25 border-t-shop" />
        <p className="text-sm font-semibold text-slate-600">Đang tải sản phẩm…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800 shadow-corporate-card">
          <p className="font-bold">Lỗi khi tải sản phẩm</p>
          <p className="mt-1 text-sm text-rose-700/90">Vui lòng tải lại trang hoặc thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Quản lý sản phẩm</h1>
            <p className={styles.headerSubtitle}>
              Quản lý và theo dõi tất cả sản phẩm trong kho
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar: Search + Add */}
      <SearchHeader
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      {/* Quick filter: preorder open */}
      <div className="mb-4 flex flex-wrap gap-2 px-1">
        <button
          type="button"
          onClick={() => {
            setPreorderOpenFilter((prev) => !prev);
            setPage(1);
          }}
          className={[
            'inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shop focus-visible:ring-offset-2',
            preorderOpenFilter
              ? 'border-transparent bg-gradient-to-r from-shop to-shopAccent text-white shadow-corporate-btn'
              : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-shop/25 hover:bg-shop/5 hover:text-shop',
          ].join(' ')}
        >
          <span>⏳</span>
          Pre-order đang mở
        </button>
      </div>

      {/* Table */}
      <ItemsTable
        items={data?.items || []}
        onDelete={handleDelete}
        onTogglePublic={handleTogglePublic}
        onClosePreorder={handleClosePreorder}
        onReopenPreorder={handleReopenPreorder}
        isDeletePending={deleteMutation.isPending}
        isTogglePublicPending={togglePublicMutation.isPending}
      />

      {/* Pagination */}
      {data?.pagination && (
        <PaginationControl
          currentPage={page}
          totalPages={data.pagination.total_pages}
          onPageChange={setPage}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        itemName={deleteConfirm?.name || ''}
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};
