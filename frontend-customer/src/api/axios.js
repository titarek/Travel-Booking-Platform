import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

/**
 * Single configured Axios instance for the entire application
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request interceptor:
 * Attaches JWT stored in localStorage ONLY to VITE_API_URL requests.
 * Strictly never attaches token to third-party endpoints or query URLs.
 */
api.interceptors.request.use(
  (config) => {
    const isTargetingOurApi = !config.url.startsWith('http://')
      && !config.url.startsWith('https://')
      || config.url.startsWith(API_BASE_URL);

    if (isTargetingOurApi) {
      const token = localStorage.getItem('travel_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor:
 * Catches 401 Unauthorized (e.g. token expired) and clears invalid local session
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear if already on login attempt endpoint
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('travel_token');
        localStorage.removeItem('travel_user');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
