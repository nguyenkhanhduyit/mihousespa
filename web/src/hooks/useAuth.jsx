import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api, { getToken, setToken, clearToken, getStoredUser, setStoredUser } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  /** Xác thực phiên hiện tại khi mount. */
  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth
      .me()
      .then((res) => {
        if (cancelled) return;
        if (res?.status === 'success' && res.data?.user) {
          setUser(res.data.user);
          setStoredUser(res.data.user);
        } else {
          clearToken();
          setUser(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setUser(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.auth.login(username, password);
    const token = res?.data?.token;
    const u = res?.data?.user;
    if (!token) throw new Error(res?.message || 'Đăng nhập thất bại');
    setToken(token);
    if (u) {
      setUser(u);
      setStoredUser(u);
    }
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: Boolean(user), token: getToken() }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
}

export default AuthContext;
