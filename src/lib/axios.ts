// src/lib/axios.ts

import axios from 'axios';
import Cookies from 'js-cookie';
const xsrf = Cookies.get('XSRF-TOKEN');
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    Authorization: `Bearer ${xsrf}`
  },
});

api.interceptors.request.use(config => {
  const token = Cookies.get('XSRF-TOKEN');
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }
  return config;
});
export default api;
