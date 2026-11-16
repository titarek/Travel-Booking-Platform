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
  const [walletBalance, setWalletBalance] = useState(() => {
    try {
      const savedUser = localStorage.getItem('travel_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.walletBalance != null ? Number(parsed.walletBalance) : 1000;
      }
      return 1000;
    } catch {
      return 1000;
    }
  });
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
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

  const fetchWallet = useCallback(async () => {
    try {
      const res = await api.get('/wallet');
      if (res.data?.data) {
        setWalletBalance(res.data.data.balance);
        setWalletTransactions(res.data.data.transactions || []);
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, walletBalance: res.data.data.balance };
          localStorage.setItem('travel_user', JSON.stringify(updated));
          return updated;
        });
        return res.data.data;
      }
    } catch {
      // fallback
    }
    return null;
  }, []);

  const topUpWallet = useCallback(async (amount, paymentMethod = 'Credit/Debit Card') => {
    const res = await api.post('/wallet/topup', {
      amount: Number(amount),
      paymentMethod,
    });
    if (res.data?.data) {
      setWalletBalance(res.data.data.balance);
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, walletBalance: res.data.data.balance };
        localStorage.setItem('travel_user', JSON.stringify(updated));
        return updated;
      });
      fetchWallet();
      return res.data;
    }
    throw new Error(res.data?.message || 'Top-up failed');
  }, [fetchWallet]);

  const updateWalletBalance = useCallback((newBalance) => {
    const num = Number(newBalance);
    setWalletBalance(num);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, walletBalance: num };
      localStorage.setItem('travel_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await api.patch('/auth/profile', data);
    if (res.data?.user) {
      setUser(res.data.user);
      localStorage.setItem('travel_user', JSON.stringify(res.data.user));
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to update profile');
  }, []);

  const changeEmail = useCallback(async (newEmail, currentPassword) => {
    const res = await api.patch('/auth/change-email', { newEmail, currentPassword });
    if (res.data?.email) {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, email: res.data.email };
        localStorage.setItem('travel_user', JSON.stringify(updated));
        return updated;
      });
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to update email');
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await api.patch('/auth/change-password', { currentPassword, newPassword });
    return res.data;
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
            if (res.data.user.walletBalance != null) {
              setWalletBalance(Number(res.data.user.walletBalance));
            }
            localStorage.setItem('travel_user', JSON.stringify(res.data.user));
            fetchWallet();
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
  }, [fetchWallet]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token && res.data?.user) {
      localStorage.setItem('travel_token', res.data.token);
      localStorage.setItem('travel_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      if (res.data.user.walletBalance != null) {
        setWalletBalance(Number(res.data.user.walletBalance));
      }
      setAuthModalState({ isOpen: false, tab: 'login' });
      fetchWallet();
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  }, [fetchWallet]);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    if (res.data?.token && res.data?.user) {
      localStorage.setItem('travel_token', res.data.token);
      localStorage.setItem('travel_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      if (res.data.user.walletBalance != null) {
        setWalletBalance(Number(res.data.user.walletBalance));
      }
      setAuthModalState({ isOpen: false, tab: 'login' });
      fetchWallet();
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  }, [fetchWallet]);

  const logout = useCallback(() => {
    localStorage.removeItem('travel_token');
    localStorage.removeItem('travel_user');
    setToken(null);
    setUser(null);
    setWalletBalance(1000);
    setWalletTransactions([]);
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

  const openTopUpModal = useCallback(() => {
    setIsTopUpModalOpen(true);
  }, []);

  const closeTopUpModal = useCallback(() => {
    setIsTopUpModalOpen(false);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    currency,
    setCurrency,
    exchangeRates,
    walletBalance,
    walletTransactions,
    isTopUpModalOpen,
    openTopUpModal,
    closeTopUpModal,
    fetchWallet,
    topUpWallet,
    updateWalletBalance,
    updateProfile,
    changeEmail,
    changePassword,
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
    setCurrency,
    exchangeRates,
    walletBalance,
    walletTransactions,
    isTopUpModalOpen,
    openTopUpModal,
    closeTopUpModal,
    fetchWallet,
    topUpWallet,
    updateWalletBalance,
    updateProfile,
    changeEmail,
    changePassword,
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
