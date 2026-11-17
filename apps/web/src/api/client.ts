import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('constructos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('constructos_token');
      localStorage.removeItem('constructos_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const formatMoney = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null) return '0 ₫';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (num: number | string | undefined, maxDecimals = 2): string => {
  if (num === undefined || num === null) return '0';
  const val = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: maxDecimals,
  }).format(val);
};

