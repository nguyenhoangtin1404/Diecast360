import {
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Check,
  X,
  Package,
  Clock,
  CheckCircle2,
  Copy,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ITEM_STATUS_LABELS, type ItemStatus } from '../../../constants/item';
import type { AdminItem } from '../../../types/item.types';
import styles from '../ItemsPage.module.css';

interface ItemsTableProps {
  items: AdminItem[];
  onDelete: (id: string, name: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
  isDeletePending: boolean;
  isTogglePublicPending: boolean;
}

export const ItemsTable = ({
  items,
  onDelete,
  onTogglePublic,
  isDeletePending,
  isTogglePublicPending,
}: ItemsTableProps) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (item: AdminItem) => {
    if (!item.fb_post_content) {
      alert('Sản phẩm chưa có nội dung sale!');
      return;
    }

    try {
      await navigator.clipboard.writeText(item.fb_post_content);

      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Không thể copy. Vui lòng thử lại.');
    }
  };

  const handleShare = (item: AdminItem) => {
    navigate(`/admin/items/${item.id}?section=social-selling`);
  };

  const renderStatusIcon = (status: ItemStatus) => {
    if (status === 'con_hang') return <Package size={18} color="#28a745" />;
    if (status === 'giu_cho') return <Clock size={18} color="#ffc107" />;
    return <CheckCircle2 size={18} color="#6c757d" />;
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={`${styles.th} ${styles.thImage}`}>Hình ảnh</th>
          <th className={styles.th}>Tên</th>
          <th className={styles.th}>Trạng thái</th>
          <th className={styles.th}>Công khai</th>
          <th className={styles.th}>Facebook</th>
          <th className={styles.th}>Giá</th>
          <th className={styles.th}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td className={`${styles.td} ${styles.tdCenter}`}>
              {item.cover_image_url ? (
                <img
                  src={item.cover_image_url}
                  alt={item.name}
                  className={styles.itemImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className={styles.noImage}>Không có ảnh</div>
              )}
            </td>
            <td className={styles.td}>{item.name}</td>
            <td className={`${styles.td} ${styles.tdCenter}`}>
              <div className={styles.statusBadge}>
                {renderStatusIcon(item.status)}
                <span>{ITEM_STATUS_LABELS[item.status].text}</span>
              </div>
            </td>
            <td className={`${styles.td} ${styles.tdCenter}`}>
              {item.is_public ? (
                <Check size={20} color="#28a745" style={{ display: 'inline-block' }} />
              ) : (
                <X size={20} color="#dc3545" style={{ display: 'inline-block' }} />
              )}
            </td>
            <td className={`${styles.td} ${styles.tdCenter}`}>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={() => handleCopy(item)}
                  disabled={!item.fb_post_content}
                  title={item.fb_post_content ? 'Copy nội dung sale' : 'Chưa có nội dung sale'}
                  className={`${styles.copyButton} ${copiedId === item.id ? styles.copyButtonCopied : ''}`}
                  style={{
                    background: copiedId === item.id ? undefined : item.fb_post_content ? undefined : 'none',
                    border: copiedId === item.id ? undefined : item.fb_post_content ? '1px solid #007bff' : '1px solid #ccc',
                    color: copiedId === item.id ? undefined : item.fb_post_content ? '#007bff' : '#ccc',
                    cursor: item.fb_post_content ? 'pointer' : 'not-allowed',
                  }}
                >
                  {copiedId === item.id ? (
                    <>
                      <Check size={14} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {item.fb_post_url ? (
                  <a
                    href={item.fb_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Mở bài FB"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: '#1877F2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>FB</span>
                  </a>
                ) : (
                  <button
                    onClick={() => handleShare(item)}
                    title="Chia sẻ lên Facebook"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      background: 'none',
                      border: '1px solid #1877F2',
                      color: '#1877F2',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </button>
                )}
              </div>
            </td>
            <td className={`${styles.td} ${styles.tdRight}`}>
              {item.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price) : '-'}
            </td>
            <td className={`${styles.td} ${styles.tdCenter}`}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={() => navigate(`/admin/items/${item.id}`)}
                  title="Sửa"
                  className={styles.iconButton}
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => onDelete(item.id, item.name)}
                  title="Xóa"
                  disabled={isDeletePending}
                  className={styles.deleteButton}
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => onTogglePublic(item.id, item.is_public)}
                  title={item.is_public ? 'Ẩn khỏi công khai' : 'Hiển thị công khai'}
                  disabled={isTogglePublicPending}
                  className={styles.iconButton}
                  style={{ opacity: isTogglePublicPending ? 0.5 : 1 }}
                >
                  {item.is_public ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
