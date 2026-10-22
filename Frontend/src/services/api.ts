import axios, { isAxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseUrl = (): string => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    }
    // In Expo Go on mobile devices, hostUri holds the development PC's IP address
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
            return `http://${ip}:8000/api`;
        }
    }
    return 'http://127.0.0.1:8000/api';
};

const API_BASE_URL = getBaseUrl();
if (__DEV__) {
    console.log('[API] Initialized Base URL:', API_BASE_URL);
}

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