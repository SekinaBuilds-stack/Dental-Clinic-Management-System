import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosError } from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Matches your NestJS backend server port
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach the JWT token from localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export default api;