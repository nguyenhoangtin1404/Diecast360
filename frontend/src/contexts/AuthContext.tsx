import React, { useState, useEffect } from 'react';
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me') as ApiResponse<{ user: User }>;
      // Response interceptor đã unwrap response.data, nên response = {ok: true, data: {user}, message: ''}
      setUser(response.data?.user);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password }) as ApiResponse<{
      access_token: string;
      refresh_token: string;
      user: User;
    }> | {
      access_token: string;
      refresh_token: string;
      user: User;
    };
    // Response interceptor đã unwrap response.data, nên response = {ok: true, data: {access_token, refresh_token, user}, message: ''}
    console.log('[AuthContext] Login response:', response);
    
    // Handle both response formats: {ok, data, message} or direct {access_token, refresh_token, user}
    const isApiResponse = (r: unknown): r is ApiResponse<{ access_token: string; refresh_token: string; user: User }> => {
      return typeof r === 'object' && r !== null && 'data' in r && 'ok' in r;
    };
    
    const responseData = isApiResponse(response) ? response.data : response;
    console.log('[AuthContext] Extracted responseData:', responseData);
    
    const { access_token, refresh_token, user } = responseData as {
      access_token: string;
      refresh_token: string;
      user: User;
    };
    
    console.log('[AuthContext] Extracted tokens:', { 
      access_token: access_token?.substring(0, 20) + '...', 
      refresh_token: refresh_token?.substring(0, 20) + '...',
      hasUser: !!user 
    });
    
    if (!access_token || !refresh_token) {
      console.error('[AuthContext] Missing tokens in response:', { access_token, refresh_token, response, responseData });
      throw new Error('Login failed: Invalid response');
    }
    
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setToken(access_token);
    setUser(user);
    console.log('[AuthContext] Tokens saved to localStorage. Verifying...', {
      access_token_stored: localStorage.getItem('access_token')?.substring(0, 20) + '...',
      refresh_token_stored: localStorage.getItem('refresh_token')?.substring(0, 20) + '...'
    });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch {
        // Ignore errors on logout
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


