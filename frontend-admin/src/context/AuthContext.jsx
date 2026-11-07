import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('travel_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('travel_token') || null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1.0, BDT: 121.5, EUR: 0.92 });
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    tab: 'login',
    adminOnly: false,
  });

  // Fetch exchange rates from backend
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await api.get('/external/exchange-rates');
        if (res.data?.rates) {
          setExchangeRates(res.data.rates);
        }
      } catch (err) {
        // Fallback default rates in place
      }
    };
    fetchRates();
  }, []);

  // Validate existing token on load via /auth/me
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('travel_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('travel_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          localStorage.removeItem('travel_token');
          localStorage.removeItem('travel_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token && res.data?.user) {
      localStorage.setItem('travel_token', res.data.token);
      localStorage.setItem('travel_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setAuthModalState({ isOpen: false, tab: 'login' });
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    if (res.data?.token && res.data?.user) {
      localStorage.setItem('travel_token', res.data.token);
      localStorage.setItem('travel_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setAuthModalState({ isOpen: false, tab: 'login' });
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('travel_token');
    localStorage.removeItem('travel_user');
    setToken(null);
    setUser(null);
  }, []);

  const openAuthModal = useCallback((tab = 'login', options = {}) => {
    setAuthModalState({
      isOpen: true,
      tab: options.adminOnly ? 'login' : tab,
      adminOnly: Boolean(options.adminOnly),
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false, adminOnly: false }));
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    currency,
    setCurrency,
    exchangeRates,
    authModalState,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
  }), [
    user,
    token,
    loading,
    currency,
    exchangeRates,
    authModalState,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
