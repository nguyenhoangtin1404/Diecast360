import { createContext } from 'react';

/** Per-shop access from `user_shop_roles` (JWT + GET /auth/me). */
export interface UserShopRole {
  shop_id: string;
  role: string;
}

export interface AllowedShopSummary {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  role?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  allowed_shop_ids?: string[];
  shop_roles?: UserShopRole[];
  allowed_shops?: AllowedShopSummary[];
  /** Bound active tenant from JWT (set after switch-shop). */
  active_shop_id?: string | null;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
