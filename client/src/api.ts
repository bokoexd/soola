import axios from 'axios';

// Get the API base URL from environment variables with a fallback
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://server-production-22f7.up.railway.app/api' 
    : 'http://localhost:3001/api');

console.log(`API base URL: ${apiBaseUrl}`);

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add longer timeout for production environment
  timeout: process.env.NODE_ENV === 'production' ? 30000 : 10000
});

// Add request interceptor to handle token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set Authorization header with token
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }
    
    // Simple logging
    console.log(`${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Simple error logging
    console.error('API Error:', error);
    
    // Log more detailed error info when available
    if (error.response) {
      console.error('API Response Error:', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('API Request Error (No Response):', {
        url: error.config?.url,
        message: error.message
      });
    }
    
    // Handle 401 unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
