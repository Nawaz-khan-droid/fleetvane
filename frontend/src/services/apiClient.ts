import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Get base URL from env, fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Shared instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for sending/receiving the HttpOnly refresh cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// We need a way to track if we're already refreshing to prevent infinite loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // In our architecture, the access token is kept in memory.
    // For React, this means we either inject it via closure or a store.
    // To keep apiClient pure, we'll expose a setter for the current token.
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // If we are refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt refresh ONCE
        // We use a separate axios instance to avoid interceptor loops
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true // Must send the HttpOnly cookie
        });
        
        const newAccessToken = refreshResponse.data.accessToken;
        
        // Save the new token in memory
        setAccessToken(newAccessToken);
        
        // Notify any queued requests
        processQueue(null, newAccessToken);
        
        // Retry original request ONCE
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // If refresh fails, clear auth state and redirect
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------
// Auth State Management Helpers (In-Memory)
// ---------------------------------------------------------

let currentAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = () => {
  return currentAccessToken;
};

export const clearAuth = () => {
  currentAccessToken = null;
  // Also clear user state from React Context if possible, but the redirect handles UI
};
