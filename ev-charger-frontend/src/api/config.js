import axios from 'axios';

// API base URL - defaults to backend on port 8081
// In Docker, use the host machine's IP or configure via environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ev-charger-finder.up.railway.app/api' || 'http://localhost:8081';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
export { API_BASE_URL };
