import { createContext, useContext, useState, useEffect } from 'react';
import api from '../hooks/useApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('civica_token');
    const storedUser = localStorage.getItem('civica_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('civica_token', t);
    localStorage.setItem('civica_user', JSON.stringify(u));
    return u;
  };

  const register = async (name, email, password, role = 'citizen') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token: t, user: u } = res.data.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('civica_token', t);
    localStorage.setItem('civica_user', JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('civica_token');
    localStorage.removeItem('civica_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
