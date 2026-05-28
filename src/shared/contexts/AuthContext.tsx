import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Api } from '../services/api/axios-config';
import { UNAUTHORIZED_EVENT, type StoredAuthUser } from './authStorage';

interface AuthContextData {
  user: StoredAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<StoredAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await Api.post<{ user: StoredAuthUser }>('/auth/login', {
      username,
      password,
    });

    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.post('/auth/logout');
    } catch {
      // Se a sessão já tiver sido encerrada no servidor, limpa o estado local mesmo assim.
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized as EventListener);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized as EventListener);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      try {
        const { data } = await Api.get<{ user: StoredAuthUser }>('/auth/me');

        if (!active) {
          return;
        }

        setUser(data.user ?? null);
      } catch {
        if (!active) {
          return;
        }

        setUser(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    validateSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextData>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
  }), [user, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};