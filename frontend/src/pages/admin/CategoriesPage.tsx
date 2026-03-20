import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tags, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { CategoryItem, ApiError, ApiResponse, CategoryType } from '../../types/category';
import { useIsMobile } from '../../hooks/useIsMobile';
import styles from './CategoriesPage.module.css';

interface CategoriesResponse {
  categories: CategoryItem[];
}

const TYPE_LABELS: Record<CategoryType, string> = {
  car_brand: 'Hãng xe',
  model_brand: 'Hãng mô hình',
};

export const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [activeType, setActiveType] = useState<CategoryType>('car_brand');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CategoryItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CategoryType>('car_brand');

  // Fetch categories
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories', activeType],
    queryFn: async () => {
      const response = await apiClient.get(`/categories?type=${activeType}`) as ApiResponse<CategoriesResponse>;
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (dto: { name: string; type: string }) => {
      return apiClient.post('/categories', dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: (error: unknown) => {
      const err = error as ApiError;
      const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      alert(message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: { name?: string; display_order?: number } }) => {
      return apiClient.patch(`/categories/${id}`, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: (error: unknown) => {
      const err = error as ApiError;
      const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      alert(message);
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/categories/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteConfirm(null);
    },
    onError: (error: unknown) => {
      const err = error as ApiError;
      const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      alert(message);
      setDeleteConfirm(null);
    },
  });

  const openCreateModal = () => {
    setFormName('');
    setFormType(activeType);
    setEditingCategory(null);
    setShowCreateModal(true);
  };

  const openEditModal = (category: CategoryItem) => {
    setFormName(category.name);
    setFormType(category.type as CategoryType);
    setEditingCategory(category);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCategory(null);
    setFormName('');
  };

  const handleSave = () => {
    if (!formName.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        dto: { name: formName.trim() },
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        type: formType,
      });
    }
  };

  const categories = (data as CategoriesResponse)?.categories || [];

  if (isLoading) return <div style={{ padding: '20px' }}>Đang tải...</div>;
  if (error) return <div style={{ padding: '20px' }}>Lỗi khi tải danh mục</div>;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Tags size={24} color="white" />
          </div>
          <div>
            <h1 className={styles.headerTitle}>Quản lý danh mục</h1>
            <p className={styles.headerSubtitle}>
              Quản lý hãng xe và hãng mô hình
            </p>
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className={styles.tabBar}>
        {(Object.entries(TYPE_LABELS) as [CategoryType, string][]).map(([type, label]) => (
          <button
            key={type}
            className={`${styles.tab} ${activeType === type ? styles.tabActive : ''}`}
            onClick={() => setActiveType(type)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Actions Bar */}
      <div className={styles.actionsBar}>
        <button className={styles.addButton} onClick={openCreateModal}>
          <Plus size={18} />
          Thêm {TYPE_LABELS[activeType].toLowerCase()}
        </button>
      </div>

      {/* Table */}
      {categories.length === 0 ? (
        <div className={styles.emptyState}>
          Chưa có danh mục nào. Nhấn "Thêm" để tạo mới.
        </div>
      ) : isMobile ? (
        <div className={styles.mobileList}>
          {categories.map((cat, index) => (
            <article key={cat.id} className={styles.mobileCard}>
              <div className={styles.mobileCardHeader}>
                <div>
                  <span className={styles.mobileLabel}>Danh mục</span>
                  <div className={styles.mobileTitle}>{cat.name}</div>
                </div>
                <span className={styles.orderNumber}>{index + 1}</span>
              </div>

              <div className={styles.mobileRow}>
                <span className={styles.mobileLabel}>Trạng thái</span>
                <span className={`${styles.activeBadge} ${cat.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                  {cat.is_active ? '● Hoạt động' : '○ Tắt'}
                </span>
              </div>

              <div className={styles.mobileActions}>
                <button
                  className={styles.iconButton}
                  title="Sửa"
                  onClick={() => openEditModal(cat)}
                  aria-label={`Sửa ${cat.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className={styles.toggleButton}
                  title={cat.is_active ? 'Tắt' : 'Bật'}
                  onClick={() => toggleMutation.mutate(cat.id)}
                  style={{ color: cat.is_active ? '#28a745' : '#999' }}
                  aria-label={cat.is_active ? `Tắt ${cat.name}` : `Bật ${cat.name}`}
                >
                  {cat.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button
                  className={styles.deleteButton}
                  title="Xoá"
                  onClick={() => setDeleteConfirm(cat)}
                  aria-label={`Xóa ${cat.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: '50px' }}>#</th>
              <th className={styles.th}>Tên</th>
              <th className={styles.th} style={{ width: '120px' }}>Trạng thái</th>
              <th className={styles.th} style={{ width: '120px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, index) => (
              <tr key={cat.id}>
                <td className={`${styles.td} ${styles.tdCenter}`}>
                  <span className={styles.orderNumber}>{index + 1}</span>
                </td>
                <td className={styles.td}>{cat.name}</td>
                <td className={`${styles.td} ${styles.tdCenter}`}>
                  <span className={`${styles.activeBadge} ${cat.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                    {cat.is_active ? '● Hoạt động' : '○ Tắt'}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.tdCenter}`}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button
                      className={styles.iconButton}
                      title="Sửa"
                      onClick={() => openEditModal(cat)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className={styles.toggleButton}
                      title={cat.is_active ? 'Tắt' : 'Bật'}
                      onClick={() => toggleMutation.mutate(cat.id)}
                      style={{ color: cat.is_active ? '#28a745' : '#999' }}
                    >
                      {cat.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      className={styles.deleteButton}
                      title="Xoá"
                      onClick={() => setDeleteConfirm(cat)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
            </h2>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tên danh mục <span style={{ color: '#dc3545' }}>*</span></label>
              <input
                type="text"
                className={styles.formInput}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nhập tên danh mục..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>
            {!editingCategory && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Loại</label>
                <select
                  className={styles.formSelect}
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as CategoryType)}
                >
                  <option value="car_brand">Hãng xe</option>
                  <option value="model_brand">Hãng mô hình</option>
                </select>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.modalBtnCancel} onClick={closeModal}>
                Huỷ
              </button>
              <button
                className={styles.modalBtnSave}
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteHeader}>
              <div className={styles.deleteIconWrapper}>
                <AlertTriangle size={24} color="#dc3545" />
              </div>
              <div>
                <h3 className={styles.deleteTitle}>Xoá danh mục</h3>
                <p className={styles.deleteSubtitle}>Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className={styles.deleteMessage}>
              Bạn có chắc muốn xoá danh mục <strong>"{deleteConfirm.name}"</strong>?
              <br />
              <span className={styles.deleteWarning}>
                Lưu ý: Không thể xoá nếu đang có sản phẩm sử dụng danh mục này.
              </span>
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnCancel} onClick={() => setDeleteConfirm(null)}>
                Huỷ
              </button>
              <button
                className={styles.modalBtnConfirm}
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Đang xoá...' : 'Xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
