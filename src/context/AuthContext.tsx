import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import type { Permission } from '../../shared/policy';
import { api, ApiError, setCsrfToken } from '../utils/api';

interface AuthState {
  user: User | null; permissions: Permission[]; loading: boolean; error: string;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>; reloadAuth: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);
export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const accept = (data: any) => { setUser(data.user); setPermissions(data.permissions); setCsrfToken(data.csrfToken); setError(''); };
  const reloadAuth = async () => {
    try { accept(await api('/auth/me')); }
    catch (e) { setUser(null); if (!(e instanceof ApiError && e.status === 401)) setError((e as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    void reloadAuth();
    const expired = () => { setUser(null); setPermissions([]); setCsrfToken(''); };
    window.addEventListener('unitask:unauthorized', expired);
    return () => window.removeEventListener('unitask:unauthorized', expired);
  }, []);
  const login = async (identifier: string, password: string) => {
    accept(await api('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }));
  };
  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); }
    catch(e) { setError((e as Error).message); throw e; }
    setUser(null); setPermissions([]); setCsrfToken('');
  };
  return <AuthContext.Provider value={{ user, permissions, loading, error, login, logout, reloadAuth }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required.');
  return value;
};
