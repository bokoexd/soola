import axios from 'axios';

const api = axios.create({
  baseURL: 'https://server-production-22f7.up.railway.app/api',
});

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
      console.log("Authentication error, redirecting to login");
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
