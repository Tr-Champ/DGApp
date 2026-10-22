import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use local backend when running in dev mode, remote when in production
const LOCAL_API = 'http://localhost:8000/api';
const REMOTE_API = 'https://dgapp.onrender.com/api';

const API_BASE_URL = __DEV__ ? LOCAL_API : REMOTE_API;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically inject JWT token into requests if available
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('user_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Log errors in dev mode for easier debugging
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (__DEV__) {
            console.error('[API Error]', error.config?.url, error.response?.status, error.response?.data);
        }
        return Promise.reject(error);
    }
);

export default api;