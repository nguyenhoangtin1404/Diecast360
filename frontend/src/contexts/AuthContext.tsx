import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../api/client';
import { clearMemoryCsrfToken, ensureCsrfBootstrap } from '../api/csrf';
import {
  AUTH_SESSION_STORAGE_KEY,
  bumpAuthSessionRevision,
  readAuthSessionRevision,
} from '../utils/authSessionSync';
import { AuthContext } from './AuthContext';
import type { User } from './AuthContext';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authSessionRevRef = useRef(readAuthSessionRevision());

  /**
   * Fetch current user info from the server
   * The access_token cookie is sent automatically
   */
  const fetchUser = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/auth/me') as ApiResponse<{ user: User }>;
      setUser(response.data?.user);
      if (response.data?.user) {
        try {
          await ensureCsrfBootstrap();
        } catch {
          /* ignore */
        }
      }
      return true;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  /**
   * Initialize auth state on app load
   * Try to fetch user - if successful, user is authenticated via cookies
   */
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        await fetchUser();
      } catch {
        // Auth initialization failed silently
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchUser]);

  /** Other tabs / windows: after logout elsewhere, re-fetch /auth/me so UI matches server cookies. */
  useEffect(() => {
    const syncFromStorageRevision = () => {
      const next = readAuthSessionRevision();
      if (next !== authSessionRevRef.current) {
        authSessionRevRef.current = next;
        void fetchUser();
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== AUTH_SESSION_STORAGE_KEY || e.storageArea !== localStorage) {
        return;
      }
      syncFromStorageRevision();
    };

    const onFocus = () => {
      syncFromStorageRevision();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFromStorageRevision();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchUser]);

  /**
   * Login with email and password
   * Server will set HttpOnly cookies automatically
   */
  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password }) as ApiResponse<{
      user: User;
      message: string;
    }> | {
      user: User;
      message: string;
    };

    // Handle both response formats: {ok, data, message} or direct {user, message}
    const isApiResponse = (r: unknown): r is ApiResponse<{ user: User; message: string }> => {
      return typeof r === 'object' && r !== null && 'data' in r && 'ok' in r;
    };

    const responseData = isApiResponse(response) ? response.data : response;

    if (!responseData?.user) {
      throw new Error('Login failed: Invalid response');
    }

    // Login payload is minimal; hydrate full profile (shop_roles, allowed_shops, active_shop_id)
    setUser(responseData.user);
    try {
      const me = (await apiClient.get('/auth/me')) as ApiResponse<{ user: User }>;
      if (me.data?.user) {
        setUser(me.data.user);
      }
    } catch {
      /* keep partial user from login if /auth/me fails */
    }

    try {
      await ensureCsrfBootstrap();
    } catch {
      /* cross-site: cookie on API host; body of /auth/csrf fills in-memory CSRF header */
    }

    bumpAuthSessionRevision();
    authSessionRevRef.current = readAuthSessionRevision();
  };

  /**
   * Logout - Server will clear HttpOnly cookies
   */
  const logout = async () => {
    try {
      await ensureCsrfBootstrap();
    } catch {
      /* align header with server csrf cookie (e.g. other tab rotated or cleared cookies) */
    }
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Logout API call failed, clearing local state anyway
    } finally {
      clearMemoryCsrfToken();
      setUser(null);
      bumpAuthSessionRevision();
      authSessionRevRef.current = readAuthSessionRevision();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
