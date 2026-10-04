import axios from 'axios';

export const api = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development' ? 'http://localhost:8787/api' : '',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
