import axios, { isAxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = (
    process.env.EXPO_PUBLIC_API_URL || 'https://dgapp.onrender.com/api'
).replace(/\/+$/, '');

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
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

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (!isAxiosError(error)) return fallback;

    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        const messages = detail
            .map((item: unknown) => {
                if (typeof item !== 'object' || item === null || !('msg' in item)) return null;
                return typeof item.msg === 'string' ? item.msg : null;
            })
            .filter((message): message is string => message !== null);
        if (messages.length) return messages.join('; ');
    }
    if (!error.response) {
        return 'Could not connect to the server. Check your internet connection and try again.';
    }

    return fallback;
}