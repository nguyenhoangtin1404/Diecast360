import { useState } from 'react';
import { apiClient } from '../../../../api/client';
import type { Shop } from '../types';
import type { ShopContactFormState } from '../types/shopContact';
import { parseShopContactFormDefaults, buildShopContactPatch } from '../shopContactForm';

export function useEditShop(
  onSuccess: (msg: string) => void,
  fetchShops: () => Promise<void>,
) {
  const [editShopModalId, setEditShopModalId] = useState<string | null>(null);
  const [editShopName, setEditShopName] = useState('');
  const [editShopContact, setEditShopContact] = useState<ShopContactFormState>(
    () => parseShopContactFormDefaults(undefined),
  );
  const [editShopSaving, setEditShopSaving] = useState(false);
  const [editShopError, setEditShopError] = useState<string | null>(null);

  const openEditShopModal = (shop: Shop) => {
    setEditShopError(null);
    setEditShopName(shop.name);
    setEditShopContact(parseShopContactFormDefaults(shop.contact_json));
    setEditShopModalId(shop.id);
  };

  const closeEditShopModal = () => {
    setEditShopModalId(null);
    setEditShopError(null);
  };

  const handleEditShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShopModalId) return;
    const name = editShopName.trim();
    if (!name) {
      setEditShopError('Tên shop không được để trống.');
      return;
    }
    setEditShopError(null);
    setEditShopSaving(true);
    try {
      await apiClient.patch(`/admin/shops/${editShopModalId}`, {
        name,
        ...buildShopContactPatch(editShopContact),
      });
      setEditShopModalId(null);
      onSuccess('Đã cập nhật thông tin shop.');
      await fetchShops();
    } catch (err: unknown) {
      const maybe = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setEditShopError(
        maybe.response?.data?.message ||
          maybe.message ||
          'Cập nhật shop thất bại.',
      );
    } finally {
      setEditShopSaving(false);
    }
  };

  return {
    editShopModalId,
    editShopName,
    editShopContact,
    editShopSaving,
    editShopError,
    setEditShopName,
    setEditShopContact,
    setEditShopError,
    openEditShopModal,
    closeEditShopModal,
    handleEditShopSubmit,
  };
}
