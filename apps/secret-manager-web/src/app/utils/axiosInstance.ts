import axios from 'axios';

export const api = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8787/api'
      : process.env.SECRET_MANAGER_SERVICE_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
