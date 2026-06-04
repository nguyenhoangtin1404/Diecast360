import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { useAuth } from '../../../hooks/useAuth';
import { useIsSuperAdmin } from '../../../hooks/useIsSuperAdmin';
import { styles } from '../ShopsPage.styles';
import { useShopItems } from './useShopItems';
import { useAuditLogs } from './useAuditLogs';
import { useShopMembers } from './hooks/useShopMembers';
import { useAddMember } from './hooks/useAddMember';
import { useEditShop } from './hooks/useEditShop';
import type { Shop } from './types';
import { shopRoleLabel, shopAuditActionLabel } from './labels';
import ShopCard from './ShopCard';
import ShopItemsModal from './modals/ShopItemsModal';
import ShopAuditModal from './modals/ShopAuditModal';
import MembersListModal from './modals/MembersListModal';
import AddMemberModal from './modals/AddMemberModal';
import EditShopModal from './modals/EditShopModal';
import MemberPasswordField from './MemberPasswordField';

interface CreateShopDto { name: string; slug?: string; }

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ShopsPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateShopDto>({ name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopActionError, setShopActionError] = useState<string | null>(null);
  const [shopActionSuccess, setShopActionSuccess] = useState<string | null>(null);
  const [shopActionLoadingId, setShopActionLoadingId] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/shops');
      setShops(res?.data || res || []);
    } catch {
      setError('Không thể tải danh sách shop.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onActionSuccess = useCallback((msg: string) => { setShopActionError(null); setShopActionSuccess(msg); }, []);

  const shopItems = useShopItems();
  const audit = useAuditLogs();
  const members = useShopMembers(onActionSuccess, fetchShops);
  const addMember = useAddMember(onActionSuccess, fetchShops);
  const editShop = useEditShop(onActionSuccess, fetchShops);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchShops(); }, [fetchShops]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/admin/shops', {
        name: form.name,
        ...(form.slug?.trim() ? { slug: form.slug.trim() } : {}),
      });
      setShowForm(false);
      setForm({ name: '' });
      await fetchShops();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e2?.response?.data?.message || e2?.message || 'Tạo shop thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Bạn chắc muốn tắt shop này?')) return;
    try {
      setShopActionError(null); setShopActionSuccess(null); setShopActionLoadingId(id);
      await apiClient.patch(`/admin/shops/${id}/deactivate`, {});
      await fetchShops();
    } catch { setShopActionError('Tắt shop thất bại.'); } finally { setShopActionLoadingId(null); }
  };

  const handleActivate = async (id: string) => {
    if (!confirm('Bạn chắc muốn mở lại shop này?')) return;
    try {
      setShopActionError(null); setShopActionSuccess(null); setShopActionLoadingId(id);
      await apiClient.patch(`/admin/shops/${id}`, { is_active: true });
      await fetchShops();
      setShopActionSuccess('Đã mở lại shop thành công.');
    } catch { setShopActionError('Mở lại shop thất bại.'); } finally { setShopActionLoadingId(null); }
  };

  if (user && !isSuperAdmin) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Quản lý Shops</h1>
        <p style={styles.error}>Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const editTargetShop = editShop.editShopModalId ? shops.find((s) => s.id === editShop.editShopModalId) : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Quản lý Shops</h1>
        <button id="create-shop-btn" style={styles.createBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hủy' : '+ Tạo shop mới'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {shopActionError && <p style={styles.error}>{shopActionError}</p>}
      {shopActionSuccess && <p style={styles.success}>{shopActionSuccess}</p>}

      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <div style={styles.formRow}>
            <label style={styles.label} htmlFor="shop-name">Tên shop</label>
            <input id="shop-name" required style={styles.input} value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ví dụ: Shop A" />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label} htmlFor="shop-slug">Slug (tùy chọn)</label>
            <input id="shop-slug" style={styles.input} value={form.slug ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Để trống để tự tạo từ tên shop" pattern="^[a-z0-9]+(-[a-z0-9]+)*$" />
          </div>
          <button id="submit-shop-form" type="submit" style={styles.createBtn} disabled={saving}>
            {saving ? 'Đang tạo...' : 'Tạo shop'}
          </button>
        </form>
      )}

      {loading ? <p>Đang tải...</p> : shops.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Chưa có shop nào.</p>
      ) : (
        <div style={styles.grid}>
          {shops.map((shop) => (
            <ShopCard
              key={shop.id} shop={shop}
              shopActionLoadingId={shopActionLoadingId}
              memberAddingForShopId={addMember.memberAddingForShopId}
              onOpenItems={shopItems.openShopItemsModal}
              onOpenMembers={members.openMembersListModal}
              onOpenAudit={audit.openAuditModal}
              onOpenEdit={editShop.openEditShopModal}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
              onOpenAddMember={addMember.openMemberModal}
            />
          ))}
        </div>
      )}

      {editShop.editShopModalId && editTargetShop && (
        <EditShopModal
          shop={editTargetShop}
          editShopName={editShop.editShopName}
          editShopContact={editShop.editShopContact}
          editShopSaving={editShop.editShopSaving}
          editShopError={editShop.editShopError}
          onClose={editShop.closeEditShopModal}
          onNameChange={(v) => { editShop.setEditShopName(v); if (editShop.editShopError) editShop.setEditShopError(null); }}
          onContactChange={editShop.setEditShopContact}
          onSubmit={editShop.handleEditShopSubmit}
        />
      )}

      <AddMemberModal
        open={Boolean(addMember.memberModalShopId)}
        shopId={addMember.memberModalShopId ?? 'unknown'}
        memberError={addMember.memberError}
        memberSuccess={addMember.memberSuccess}
        memberFullName={addMember.memberFullName}
        memberEmail={addMember.memberEmail}
        memberEmailError={addMember.memberEmailError}
        memberRole={addMember.memberRole}
        adding={Boolean(addMember.memberModalShopId && addMember.memberAddingForShopId === addMember.memberModalShopId)}
        memberEmailInputRef={addMember.memberEmailInputRef}
        onClose={addMember.closeMemberModal}
        onFullNameChange={addMember.setMemberFullName}
        onEmailChange={(v) => { addMember.setMemberEmail(v); if (addMember.memberEmailError) addMember.setMemberEmailError(null); if (addMember.memberError) addMember.setMemberError(null); }}
        onEmailBlur={() => {
          const t = addMember.memberEmail.trim();
          if (!t) { addMember.setMemberEmailError(null); return; }
          addMember.setMemberEmailError(EMAIL_FORMAT.test(t) ? null : 'Email không đúng định dạng (vd: ten@example.com).');
        }}
        onRoleChange={addMember.setMemberRole}
        onSubmit={() => { if (addMember.memberModalShopId) void addMember.handleAddShopAdmin(addMember.memberModalShopId); }}
        passwordField={
          <MemberPasswordField
            shopId={addMember.memberModalShopId ?? 'unknown'}
            value={addMember.memberPassword}
            error={addMember.memberPasswordError}
            inputRef={addMember.memberPasswordInputRef}
            onChange={(v) => { addMember.setMemberPassword(v); if (addMember.memberPasswordError) addMember.setMemberPasswordError(null); if (addMember.memberError) addMember.setMemberError(null); }}
            onError={addMember.setMemberPasswordError}
          />
        }
      />

      <ShopItemsModal
        open={Boolean(shopItems.itemsListShopId)}
        shopName={shopItems.itemsListShopName}
        draftQuery={shopItems.itemsDraftQuery}
        pageSize={shopItems.itemsPageSize}
        loading={shopItems.shopItemsLoading}
        error={shopItems.shopItemsError}
        items={shopItems.shopItems}
        total={shopItems.itemsTotal}
        page={shopItems.itemsPage}
        totalPages={shopItems.itemsTotalPages}
        onClose={shopItems.closeShopItemsModal}
        onDraftQueryChange={shopItems.setItemsDraftQuery}
        onSubmitSearch={shopItems.handleShopItemsSearchSubmit}
        onChangePageSize={shopItems.handleShopItemsPageSizeChange}
        onChangePage={shopItems.handleShopItemsChangePage}
      />

      <ShopAuditModal
        open={Boolean(audit.auditModalShopId)}
        shopId={audit.auditModalShopId}
        shopName={audit.auditModalShopName}
        logs={audit.auditLogs}
        loading={audit.auditLoading}
        error={audit.auditError}
        actionFilter={audit.auditActionFilter}
        page={audit.auditPage}
        pageSize={audit.auditPageSize}
        totalPages={audit.auditTotalPages}
        onClose={audit.closeAuditModal}
        onActionFilterChange={audit.handleAuditActionFilterChange}
        onPageSizeChange={audit.handleAuditPageSizeChange}
        onPrevPage={audit.handleAuditPrevPage}
        onNextPage={audit.handleAuditNextPage}
        actionLabel={shopAuditActionLabel}
      />

      <MembersListModal
        open={Boolean(members.membersListShopId)}
        shopName={members.membersListShopName}
        members={members.membersList}
        loading={members.membersListLoading}
        error={members.membersListError}
        page={members.membersPage}
        pageSize={members.membersPageSize}
        total={members.membersTotal}
        totalPages={members.membersTotalPages}
        memberAccountActionUserId={members.memberAccountActionUserId}
        onClose={members.closeMembersListModal}
        onPageSizeChange={members.handleMembersPageSizeChange}
        onPrevPage={members.handleMembersPrevPage}
        onNextPage={members.handleMembersNextPage}
        onOpenResetPassword={members.openMemberResetPassword}
        onToggleActive={members.handleMemberAccountActive}
        roleLabel={shopRoleLabel}
        resetModal={members.resetModalProps}
      />
    </div>
  );
};

export default ShopsPage;
