import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Eye, EyeOff, Trash2, Check, X, Package, Clock, CheckCircle2, ChevronLeft, ChevronRight, Plus, Search, AlertTriangle, Box, Copy } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  status: string;
  is_public: boolean;
  cover_image_url?: string | null;
  price?: number | null;
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
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });
      if (search) params.append('q', search);
      // Response interceptor đã unwrap, response = {ok: true, data: {items: [...], pagination: {...}}, message: ''}
      const response = await apiClient.get(`/items?${params.toString()}`) as ApiResponse<ItemsResponse>;
      return response.data; // response.data = {items: [...], pagination: {...}}
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
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
      <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
          >
            <Box size={24} color="white" />
          </div>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: '700', 
              color: '#1a1a1a',
              letterSpacing: '-0.5px',
              lineHeight: '1.2',
            }}>
              Quản lý sản phẩm
            </h1>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '14px', 
              color: '#666',
              fontWeight: '400',
            }}>
              Quản lý và theo dõi tất cả sản phẩm trong kho
            </p>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          position: 'relative', 
          display: 'inline-flex', 
          alignItems: 'center',
          width: '100%',
          maxWidth: '400px',
        }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              color: '#999',
              pointerEvents: 'none',
            }} 
          />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ 
              padding: '10px 12px 10px 40px', 
              width: '100%',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#007bff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            }}
          />
        </div>
        <Link 
          to="/admin/items/new" 
          style={{ 
            marginLeft: '10px', 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0056b3';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#007bff';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Plus size={18} />
          <span>Sản phẩm mới</span>
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', width: '80px' }}>Hình ảnh</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tên</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Trạng thái</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Công khai</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Sale Content</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Giá</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.map((item: Item) => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                {item.cover_image_url ? (
                  <img
                    src={item.cover_image_url}
                    alt={item.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                    }}
                    onError={(e) => {
                      // Hide image on error
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: '12px',
                      border: '1px solid #ddd',
                    }}
                  >
                    Không có ảnh
                  </div>
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                {item.status === 'con_hang' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Package size={18} color="#28a745" />
                    <span style={{ fontSize: '14px' }}>Còn hàng</span>
                  </div>
                ) : item.status === 'giu_cho' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Clock size={18} color="#ffc107" />
                    <span style={{ fontSize: '14px' }}>Giữ chỗ</span>
                  </div>
                ) : item.status === 'da_ban' ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <CheckCircle2 size={18} color="#6c757d" />
                    <span style={{ fontSize: '14px' }}>Đã bán</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '14px' }}>{item.status}</span>
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                {item.is_public ? (
                  <Check size={20} color="#28a745" style={{ display: 'inline-block' }} />
                ) : (
                  <X size={20} color="#dc3545" style={{ display: 'inline-block' }} />
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                <button
                  onClick={async () => {
                    try {
                      // TODO: AI Generate sale content và copy to clipboard
                      // Tạm thời tạo nội dung mẫu để copy
                      const saleContent = `${item.name}\n\nGiá: ${item.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price) : 'Liên hệ'}\n\nTrạng thái: ${item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : 'Đã bán'}\n\n#diecast #modelcar`;
                      
                      await navigator.clipboard.writeText(saleContent);
                      
                      // Hiển thị thông báo
                      const notification = document.createElement('div');
                      notification.textContent = 'Đã copy nội dung sale!';
                      notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #28a745;
                        color: white;
                        padding: 12px 20px;
                        borderRadius: 8px;
                        boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        zIndex: 10000;
                        fontSize: 14px;
                        fontWeight: 500;
                        display: flex;
                        alignItems: center;
                        gap: 8px;
                        animation: slideIn 0.3s ease-out;
                      `;
                      
                      const checkIcon = document.createElement('div');
                      checkIcon.innerHTML = '✓';
                      checkIcon.style.cssText = 'fontSize: 18px; fontWeight: bold;';
                      notification.appendChild(checkIcon);
                      
                      document.body.appendChild(notification);
                      
                      setTimeout(() => {
                        notification.style.animation = 'slideOut 0.3s ease-out';
                        setTimeout(() => {
                          document.body.removeChild(notification);
                        }, 300);
                      }, 2000);
                    } catch (error) {
                      console.error('Error copying to clipboard:', error);
                      alert('Không thể copy. Vui lòng thử lại.');
                    }
                  }}
                  title="Copy nội dung sale để đăng Facebook"
                  style={{
                    background: 'none',
                    border: '1px solid #007bff',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    color: '#007bff',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#007bff';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = '#007bff';
                  }}
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                {item.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price) : '-'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                  <button
                    onClick={() => navigate(`/admin/items/${item.id}`)}
                    title="Sửa"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s',
                      color: '#333',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    title="Xóa"
                    disabled={deleteMutation.isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: deleteMutation.isPending ? 0.5 : 1,
                      transition: 'background-color 0.2s',
                      color: '#dc3545',
                    }}
                    onMouseEnter={(e) => {
                      if (!deleteMutation.isPending) {
                        e.currentTarget.style.backgroundColor = '#fee';
                      }
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => handleTogglePublic(item.id, item.is_public)}
                    title={item.is_public ? 'Ẩn khỏi công khai' : 'Hiển thị công khai'}
                    disabled={togglePublicMutation.isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: togglePublicMutation.isPending ? 'not-allowed' : 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: togglePublicMutation.isPending ? 0.5 : 1,
                      transition: 'background-color 0.2s',
                      color: '#333',
                    }}
                    onMouseEnter={(e) => {
                      if (!togglePublicMutation.isPending) {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {item.is_public ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data?.pagination && (
        <div style={{ 
          marginTop: '30px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: page === 1 ? '#f5f5f5' : '#fff',
              color: page === 1 ? '#999' : '#333',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              opacity: page === 1 ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (page !== 1) {
                e.currentTarget.style.background = '#f0f0f0';
                e.currentTarget.style.borderColor = '#007bff';
              }
            }}
            onMouseLeave={(e) => {
              if (page !== 1) {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#ddd';
              }
            }}
          >
            <ChevronLeft size={18} />
            <span>Trước</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '0 12px',
          }}>
            {Array.from({ length: Math.min(5, data.pagination.total_pages) }, (_, i) => {
              let pageNum;
              if (data.pagination.total_pages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= data.pagination.total_pages - 2) {
                pageNum = data.pagination.total_pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              if (pageNum < 1 || pageNum > data.pagination.total_pages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    minWidth: '36px',
                    height: '36px',
                    padding: '0 8px',
                    border: page === pageNum ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '6px',
                    background: page === pageNum ? '#007bff' : '#fff',
                    color: page === pageNum ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: page === pageNum ? '600' : '400',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (page !== pageNum) {
                      e.currentTarget.style.background = '#f0f0f0';
                      e.currentTarget.style.borderColor = '#007bff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (page !== pageNum) {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#ddd';
                    }
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <span style={{
            padding: '0 12px',
            fontSize: '14px',
            color: '#666',
            whiteSpace: 'nowrap',
          }}>
            Trang {page} / {data.pagination.total_pages}
          </span>

          <button
            disabled={page >= data.pagination.total_pages}
            onClick={() => setPage(page + 1)}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: page >= data.pagination.total_pages ? '#f5f5f5' : '#fff',
              color: page >= data.pagination.total_pages ? '#999' : '#333',
              cursor: page >= data.pagination.total_pages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              opacity: page >= data.pagination.total_pages ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (page < data.pagination.total_pages) {
                e.currentTarget.style.background = '#f0f0f0';
                e.currentTarget.style.borderColor = '#007bff';
              }
            }}
            onMouseLeave={(e) => {
              if (page < data.pagination.total_pages) {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#ddd';
              }
            }}
          >
            <span>Sau</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#fee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} color="#dc3545" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>
                  Xác nhận xóa
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa sản phẩm <strong>"{deleteConfirm.name}"</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#333',
                  cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  opacity: deleteMutation.isPending ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!deleteMutation.isPending) {
                    e.currentTarget.style.background = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: deleteMutation.isPending ? '#ccc' : '#dc3545',
                  color: 'white',
                  cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!deleteMutation.isPending) {
                    e.currentTarget.style.background = '#c82333';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc3545';
                }}
              >
                {deleteMutation.isPending ? (
                  <span>Đang xóa...</span>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

