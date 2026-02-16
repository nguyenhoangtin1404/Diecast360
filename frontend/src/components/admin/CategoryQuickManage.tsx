import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, ToggleLeft, ToggleRight, X, Pencil, Trash2, Check } from 'lucide-react';
import { apiClient } from '../../api/client';
import type { CategoryItem, ApiError } from '../../types/category';
import styles from './CategoryQuickManage.module.css';

interface Props {
  type: 'car_brand' | 'model_brand';
  categories: CategoryItem[];
}

export const CategoryQuickManage = ({ type, categories }: Props) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const typeLabel = type === 'car_brand' ? 'hãng xe' : 'hãng mô hình';

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiClient.post('/categories', { name, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', type] });
      setNewName('');
      setError('');
    },
    onError: (err: unknown) => {
      const e = err as ApiError;
      setError(e?.response?.data?.message || e?.message || 'Có lỗi xảy ra');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return apiClient.patch(`/categories/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', type] });
      setEditingId(null);
      setError('');
    },
    onError: (err: unknown) => {
      const e = err as ApiError;
      setError(e?.response?.data?.message || e?.message || 'Có lỗi xảy ra');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/categories/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', type] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', type] });
      setDeleteConfirmId(null);
      setError('');
    },
    onError: (err: unknown) => {
      const e = err as ApiError;
      setError(e?.response?.data?.message || e?.message || 'Có lỗi xảy ra');
    },
  });

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setError('');
    createMutation.mutate(trimmed);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    
    // Check if name changed
    const original = categories.find(c => c.id === editingId);
    if (original && trimmed === original.name) {
      setEditingId(null);
      return;
    }

    setError('');
    updateMutation.mutate({ id: editingId, name: trimmed });
  };

  const startEditing = (category: CategoryItem) => {
    setEditingId(category.id);
    setEditName(category.name);
    setDeleteConfirmId(null);
    setError('');
  };

  const handleDelete = (id: string) => {
    setError('');
    deleteMutation.mutate(id);
  }

  // Show all categories (active + inactive) sorted
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return a.display_order - b.display_order;
  });

  return (
    <div className={styles.wrapper} ref={popoverRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title={`Quản lý ${typeLabel}`}
      >
        <Settings size={16} />
      </button>

      {isOpen && (
        <div className={styles.popover}>
          {/* Header */}
          <div className={styles.header}>
            <span className={styles.headerTitle}>Quản lý {typeLabel}</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Add */}
          <div className={styles.addRow}>
            <input
              ref={inputRef}
              type="text"
              className={styles.addInput}
              placeholder={`Thêm ${typeLabel} mới...`}
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleAdd}
              disabled={createMutation.isPending || !newName.trim()}
            >
              <Plus size={16} />
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}

          {/* Category List */}
          <div className={styles.list}>
            {sortedCategories.length === 0 ? (
              <div className={styles.empty}>Chưa có {typeLabel} nào</div>
            ) : (
              sortedCategories.map((cat) => (
                <div key={cat.id} className={`${styles.item} ${!cat.is_active ? styles.itemInactive : ''}`}>
                  
                  {editingId === cat.id ? (
                     <div className={styles.editRow}>
                      <input
                        ref={editInputRef}
                        type="text"
                        className={styles.editInput}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button 
                        className={styles.actionIconBtn} 
                        onClick={handleUpdate}
                        disabled={updateMutation.isPending}
                        title="Lưu"
                      >
                        <Check size={14} color="#28a745" />
                      </button>
                      <button 
                        className={styles.actionIconBtn} 
                        onClick={() => setEditingId(null)}
                        title="Huỷ"
                      >
                        <X size={14} color="#666" />
                      </button>
                    </div>
                  ) : deleteConfirmId === cat.id ? (
                    <div className={styles.deleteRow}>
                       <span className={styles.confirmText}>Xoá?</span>
                       <button
                          className={styles.confirmBtn}
                          onClick={() => handleDelete(cat.id)}
                          disabled={deleteMutation.isPending}
                       >
                         Có
                       </button>
                       <button
                          className={styles.cancelBtn}
                          onClick={() => setDeleteConfirmId(null)}
                       >
                         Huỷ
                       </button>
                    </div>
                  ) : (
                    <>
                      <span className={styles.itemName} title={cat.name}>{cat.name}</span>
                      <div className={styles.actionsGroup}>
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => startEditing(cat)}
                          title="Sửa"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => setDeleteConfirmId(cat.id)}
                          title="Xoá"
                        >
                          <Trash2 size={12} />
                        </button>
                        
                        <div className={styles.divider} />
                        
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => toggleMutation.mutate(cat.id)}
                          title={cat.is_active ? 'Tắt' : 'Bật'}
                        >
                          {cat.is_active
                            ? <ToggleRight size={18} color="#28a745" />
                            : <ToggleLeft size={18} color="#999" />
                          }
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <span className={styles.footerCount}>
              {categories.filter(c => c.is_active).length}/{categories.length} hoạt động
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
