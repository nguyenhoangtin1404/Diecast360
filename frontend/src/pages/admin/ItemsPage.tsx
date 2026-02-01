import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './ItemsPage.module.css';

// Sub-components
import { SearchHeader } from './components/SearchHeader';
import { ItemsTable } from './components/ItemsTable';
import { PaginationControl } from './components/PaginationControl';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

interface Item {
  id: string;
  name: string;
  status: string;
  is_public: boolean;
  cover_image_url?: string | null;
  price?: number | null;
  fb_post_content?: string | null;
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface ItemsResponse {
  items: Item[];
  pagination: Pagination;
}

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message: string;
}

export const ItemsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', page, debouncedSearch],
    queryFn: async () => {
      // Use Semantic Search if query is present
      if (debouncedSearch) {
        const params = new URLSearchParams({
          q: debouncedSearch,
        });
        const response = await apiClient.get(`/items/search?${params.toString()}`) as ApiResponse<ItemsResponse>;
        return response.data;
      }

      // Default listing
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });
      
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

  if (isLoading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi khi tải sản phẩm</div>;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Box size={24} color="white" />
          </div>
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

      {/* Table */}
      <ItemsTable 
        items={data?.items || []}
        onDelete={handleDelete}
        onTogglePublic={handleTogglePublic}
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
