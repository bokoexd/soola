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

// Add request interceptor to handle CORS credentials and headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Standard way to set headers in Axios
      config.headers = config.headers || new axios.AxiosHeaders();
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`);
    } else {
      // For production, log requests to help with debugging
      console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log errors for debugging
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
    } else {
      console.error('API Error:', error.message);
    }
    
    if (error.response && error.response.status === 401) {
      // If we get a 401, it might be because the token is expired
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      
      // Check if we're not already on the login page to avoid redirect loops
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
