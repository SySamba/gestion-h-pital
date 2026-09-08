import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.me()
        .then((res) => {
          setUser(res.data.user);
          setProfile(res.data.profile);
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    const me = await api.me();
    setProfile(me.data.profile);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.register({ ...data, role: 'patient' });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    const me = await api.me();
    setProfile(me.data.profile);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
