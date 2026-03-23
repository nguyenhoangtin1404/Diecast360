import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

interface Shop {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  _count?: { items: number; user_roles: number };
}

interface CreateShopDto {
  name: string;
  slug: string;
}

const ShopsPage: React.FC = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateShopDto>({ name: '', slug: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/shops') as any;
      setShops(res?.data || res || []);
    } catch {
      setError('Không thể tải danh sách shop.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/admin/shops', form);
      setShowForm(false);
      setForm({ name: '', slug: '' });
      await fetchShops();
    } catch (err: any) {
      setError(err?.message?.message || 'Tạo shop thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Bạn chắc muốn tắt shop này?')) return;
    try {
      await apiClient.patch(`/admin/shops/${id}/deactivate`, {});
      await fetchShops();
    } catch {
      alert('Tắt shop thất bại.');
    }
  };

  // Guard: non-super_admin gets a 403 from the API, but show UI message too
  if (user && user.role !== 'super_admin') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Quản lý Shops</h1>
        <p style={styles.error}>Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Quản lý Shops</h1>
        <button
          id="create-shop-btn"
          style={styles.createBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hủy' : '+ Tạo shop mới'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <div style={styles.formRow}>
            <label style={styles.label} htmlFor="shop-name">Tên shop</label>
            <input
              id="shop-name"
              required
              style={styles.input}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ví dụ: Shop A"
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label} htmlFor="shop-slug">Slug</label>
            <input
              id="shop-slug"
              required
              style={styles.input}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Ví dụ: shop-a (không dấu, không khoảng trắng)"
              pattern="^[a-z0-9-]+$"
            />
          </div>
          <button id="submit-shop-form" type="submit" style={styles.createBtn} disabled={saving}>
            {saving ? 'Đang tạo...' : 'Tạo shop'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : shops.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Chưa có shop nào.</p>
      ) : (
        <div style={styles.grid}>
          {shops.map((shop) => (
            <div key={shop.id} style={{ ...styles.card, opacity: shop.is_active ? 1 : 0.5 }}>
              <div style={styles.cardHeader}>
                <span style={{ ...styles.dot, background: shop.is_active ? '#22c55e' : '#9ca3af' }} />
                <strong style={styles.shopName}>{shop.name}</strong>
                <code style={styles.slug}>{shop.slug}</code>
              </div>
              <div style={styles.meta}>
                <span>📦 {shop._count?.items ?? 0} mặt hàng</span>
                <span>👥 {shop._count?.user_roles ?? 0} thành viên</span>
              </div>
              {shop.is_active && (
                <button
                  style={styles.deactivateBtn}
                  onClick={() => handleDeactivate(shop.id)}
                >
                  Tắt shop
                </button>
              )}
              {!shop.is_active && <span style={styles.inactiveLabel}>Đã tắt</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 700, margin: 0 },
  createBtn: {
    padding: '8px 16px', background: '#6366f1', color: '#fff',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
  },
  form: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', padding: '20px', marginBottom: '24px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  formRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 500, color: '#d1d5db' },
  input: {
    padding: '8px 12px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
    color: 'inherit', fontSize: '14px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  card: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  shopName: { fontSize: '16px', flex: 1 },
  slug: { fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' },
  meta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#9ca3af' },
  deactivateBtn: {
    padding: '6px 12px', background: 'transparent', color: '#ef4444',
    border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
  },
  inactiveLabel: { fontSize: '12px', color: '#9ca3af' },
  error: { color: '#ef4444', marginBottom: '16px' },
};

export default ShopsPage;
