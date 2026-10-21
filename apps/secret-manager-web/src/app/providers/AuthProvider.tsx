'use client';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api, getErrorMessage } from '../utils/axiosInstance';
import { UserType } from '../types';
import { showToaster } from '../utils/toasters';

type AuthContextValue = {
  user: UserType;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    api
      .get('/auth/session')
      .then((response) => {
        setUser(response.data.data);
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      showToaster({
        type: 'error',
        title: getErrorMessage(error, 'Failed to sign out'),
      });
      return;
    }

    router.replace('/login');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading...
      </div>
    );
  }

  return <AuthContext value={{ user, logout }}>{children}</AuthContext>;
};
