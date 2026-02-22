import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

export default function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('prism_token');
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then((r) => setUser(r.data))
      .catch(() => { localStorage.removeItem('prism_token'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    setError('');
    const res = await authApi.login(email, password);
    localStorage.setItem('prism_token', res.data.access_token);
    const me = await authApi.me();
    setUser(me.data);
    return me.data;
  }, []);

  const register = useCallback(async (email, password) => {
    setError('');
    const res = await authApi.register(email, password);
    localStorage.setItem('prism_token', res.data.access_token);
    const me = await authApi.me();
    setUser(me.data);
    return me.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('prism_token');
    setUser(null);
  }, []);

  return { user, loading, error, setError, login, register, logout };
}
