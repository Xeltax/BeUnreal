import axios from 'axios';

const API_URL = import.meta.env.VITE_USERS_URL + '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('beunreal_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);

        if (error.response) {
            if (error.response.status === 401) {
                console.error('Session expirée ou non autorisé');

                localStorage.removeItem('beunreal_token');
                localStorage.removeItem('beunreal_user');

                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;