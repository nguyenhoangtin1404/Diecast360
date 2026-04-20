import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { csrfHeaderPair, ensureCsrfBootstrap, fetchWithCsrfRetry } from './csrf';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: This enables sending/receiving cookies
});

// Request interceptor - Cookies are automatically sent with withCredentials: true
apiClient.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const extra = csrfHeaderPair();
      const h = config.headers ?? {};
      for (const [k, v] of Object.entries(extra)) {
        (h as Record<string, string>)[k] = v;
      }
      config.headers = h;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors and automatic token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Backend returns {ok: true, data: {...}, message: ''}
    // Unwrap response.data for convenience
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error.response?.data || error);
    }

    const errData = error.response?.data as { error?: { code?: string } } | undefined;
    const reqWithFlags = originalRequest as typeof originalRequest & { _csrfRetry?: boolean };
    if (
      error.response?.status === 403 &&
      errData?.error?.code === 'CSRF_INVALID' &&
      !reqWithFlags._csrfRetry
    ) {
      const method = (originalRequest.method || 'get').toUpperCase();
      const url = String(originalRequest.url || '');
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
        !url.includes('/auth/csrf')
      ) {
        reqWithFlags._csrfRetry = true;
        try {
          await ensureCsrfBootstrap();
          return apiClient(originalRequest);
        } catch {
          return Promise.reject(error.response?.data || error);
        }
      }
    }

    // Skip refresh attempt for auth endpoints to avoid loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    
    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using cookie-based refresh
        // The refresh_token cookie will be sent automatically
        const refreshResponse = await (async () => {
          const doRefresh = () =>
            axios.post(
              `${API_CONFIG.BASE_URL}/auth/refresh`,
              {},
              {
                withCredentials: true,
                headers: csrfHeaderPair(),
              },
            );
          try {
            return await doRefresh();
          } catch (e) {
            if (
              axios.isAxiosError(e) &&
              e.response?.status === 403 &&
              (e.response?.data as { error?: { code?: string } })?.error?.code === 'CSRF_INVALID'
            ) {
              await ensureCsrfBootstrap();
              return await doRefresh();
            }
            throw e;
          }
        })();

        // Check if refresh was successful
        if (refreshResponse.status === 200) {
          // Retry the original request - new access_token cookie will be sent automatically
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - only redirect if user is trying to access protected page
        // Don't redirect if:
        // 1. Already on login page
        // 2. On public pages (catalog, etc.)
        const isProtectedPage = window.location.pathname.startsWith('/admin') && 
                                !window.location.pathname.includes('/login');
        
        if (isProtectedPage) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);

/**
 * Download a file as a Blob
 * Useful for CSV exports and other file downloads
 */
export const downloadFile = async (url: string): Promise<Blob> => {
  const response = await axios.get(`${API_CONFIG.BASE_URL}${url}`, {
    responseType: 'blob',
    withCredentials: true,
  });
  return response.data;
};

/**
 * Upload a file with FormData
 * Useful for image uploads and other file uploads
 */
export const uploadFile = async <T = unknown>(
  url: string, 
  formData: FormData
): Promise<T> => {
  const response = await fetchWithCsrfRetry(() =>
    axios.post(`${API_CONFIG.BASE_URL}${url}`, formData, {
      withCredentials: true,
      headers: csrfHeaderPair(),
      // DO NOT set Content-Type manually — Axios auto-detects
      // multipart/form-data with correct boundary from FormData
    }),
  );
  return response.data;
};
