import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { User } from '../types';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('constructos_user_info');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check current session from HttpOnly cookie on mount
  useEffect(() => {
    let isMounted = true;
    authService
      .getMe()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user);
          localStorage.setItem('constructos_user_info', JSON.stringify(user));
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(null);
          localStorage.removeItem('constructos_user_info');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(u, p);
      setCurrentUser(res.user);
      localStorage.setItem('constructos_user_info', JSON.stringify(res.user));
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('constructos_user_info');
      window.location.href = '/login';
    }
  }, []);

  const switchRole = useCallback(async (roleUsername: string) => {
    const passwordMap: Record<string, string> = {
      admin: 'Admin@123',
      sales: 'Sales@123',
      warehouse: 'Warehouse@123',
      accountant: 'Accountant@123',
    };
    await login(roleUsername, passwordMap[roleUsername] || 'Admin@123');
  }, [login]);

  return {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isLoading,
    login,
    logout,
    switchRole,
  };
};
