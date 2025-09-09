import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000/api", // matches your backend
});

// Automatically attach token to every request if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log('API Request with token:', config.method?.toUpperCase(), config.url, 'Token:', token ? 'Present' : 'Missing');
  } else {
    console.log('API Request without token:', config.method?.toUpperCase(), config.url);
  }
  return config;
});

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('Authentication failed. Token may be invalid or expired.');
      // Optionally redirect to login or clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Force redirect to login so the user can re-authenticate
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;