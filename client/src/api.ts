import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to handle CORS credentials and headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get a 401, it might be because the token is expired
      // console.log("Authentication error, redirecting to login"); // Keep for debugging if needed
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
