import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor để thêm token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Client] Token added to request:', config.url, token.substring(0, 20) + '...');
    } else {
      console.warn('[API Client] No access token found in localStorage for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor để handle errors và refresh token
apiClient.interceptors.response.use(
  (response) => {
    // Backend trả về {ok: true, data: {...}, message: ''}
    // Axios response.data = {ok: true, data: {...}, message: ''}
    // Trả về response.data để unwrap
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Dùng axios trực tiếp để tránh interceptor loop, response sẽ là full axios response
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          // Backend trả về {ok: true, data: {access_token, refresh_token}, message: ''}
          const responseData = response.data.data || response.data;
          const { access_token, refresh_token: newRefreshToken } = responseData;
          localStorage.setItem('access_token', access_token);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);

