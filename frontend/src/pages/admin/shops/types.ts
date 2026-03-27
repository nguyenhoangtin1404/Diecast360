export interface Shop {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  _count?: { items: number; user_roles: number };
}

export interface ShopMemberRow {
  user_id: string;
  shop_id: string;
  role: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
  };
}

export interface ShopItemRow {
  id: string;
  name: string;
  price: number | null;
  created_at: string;
  cover_image_url: string | null;
}

export interface ShopAuditLogRow {
  id: string;
  action:
    | 'add_shop_admin'
    | 'reset_member_password'
    | 'set_member_active'
    | 'update_shop'
    | 'deactivate_shop'
    | 'activate_shop';
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: { id: string; email: string; full_name: string | null } | null;
}
