import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL + '/api'
    : '/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: false,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('selectedLanguageId');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
