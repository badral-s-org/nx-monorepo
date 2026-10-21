import axios from 'axios';

// Requests go through the Next.js rewrite in next.config.js, see `rewrites`.
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.response.use(undefined, (error) => {
  const isSessionCheck = error.config?.url === '/auth/session';

  // The session expired while using the app: send the user back to login.
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 401 &&
    !isSessionCheck &&
    typeof window !== 'undefined' &&
    window.location.pathname !== '/login'
  ) {
    window.location.assign('/login');
  }

  return Promise.reject(error);
});

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};
