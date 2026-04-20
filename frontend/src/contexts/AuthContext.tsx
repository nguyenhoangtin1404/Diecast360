import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
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
          await apiClient.get('/auth/csrf');
        } catch {
          /* cookie may still be set; ignore */
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
  };

  /**
   * Logout - Server will clear HttpOnly cookies
   */
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Logout API call failed, clearing local state anyway
    } finally {
      setUser(null);
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
