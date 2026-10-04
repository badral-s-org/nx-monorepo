'use client';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { api } from '../utils/axiosInstance';
import { UserType } from '../types';
import axios from 'axios';
import { showToaster } from '../utils/toasters';

export const AuthContext = createContext<UserType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get('/auth/session')
      .then((response) => {
        setUser(response.data);
      })
      .catch((error) => {
        if (axios.isAxiosError(error)) {
          const errorResponse = error.response;
          showToaster({ type: 'error', title: errorResponse?.data.message });
          window.location.href = '/login';
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  if (user === null) {
    window.location.href = '/login';
  }

  return <AuthContext value={user}>{children}</AuthContext>;
};
