import axios from 'axios';

const api = axios.create({
    // In production (Vercel), we use relative path '/api' to access Serverless Functions
    // In development, we use localhost:3000 or VITE_API_URL if set
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'),
});

api.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('ecoplay_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
