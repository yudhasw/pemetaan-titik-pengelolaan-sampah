import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const authStatus = await api.checkSession();
      setIsAuthenticated(authStatus);
      setError(null);
    } catch (err: any) {
      setIsAuthenticated(false);
      setError(err?.message || 'Gagal memeriksa status autentikasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (password: string) => {
    setError(null);
    try {
      await api.login(password);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err?.message || 'Password salah atau gagal terhubung.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setIsAuthenticated(false);
    }
  };

  return {
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkAuth,
  };
}
