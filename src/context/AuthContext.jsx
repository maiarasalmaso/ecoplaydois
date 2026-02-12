import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ecoplay_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Fetch user data directly from backend to ensure we have latest streak/score
          // Set default headers for this request since they might not be set yet globally
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Invalid token or session expired", error);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    localStorage.setItem('ecoplay_token', token);
    setToken(token);
    setUser(user);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const register = async (fullName, email, password) => {
    await api.post('/users', {
      full_name: fullName,
      email,
      password
    });
    // Auto login after register? Or just return success
    await login(email, password);
  };

  const sync = async (username) => {
    const response = await api.post('/auth/sync', { username });
    const { token, user } = response.data;

    localStorage.setItem('ecoplay_token', token);
    setToken(token);
    setUser(user);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return user;
  };

  const logout = () => {
    // Clear authentication
    localStorage.removeItem('ecoplay_token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];

    // 🔒 CRITICAL: Clear ALL game state to prevent data leakage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('ecoplay_progress_') ||
        key.startsWith('ecoplay_modules_') ||
        key.startsWith('ecoplay_energy_') ||
        key.startsWith('ecoplay_credits_') ||
        key.startsWith('ecoplay_last_time_') ||
        key === 'ecoplay.feedback.submitted'
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('[Auth] Logout complete. All user data cleared.');
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.patch('/auth/me', data);
      setUser(prev => ({ ...prev, ...response.data }));
      return response.data;
    } catch (error) {
      console.error('Failed to update profile', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, register, sync, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
