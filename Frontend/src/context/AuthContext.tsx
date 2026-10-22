import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

interface AuthUser {
    id: string;
    email: string;
    is_admin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem('user_token');
        setToken(null);
        setUser(null);
    }, []);

    const loadStoredAuth = useCallback(async () => {
        try {
            const storedToken = await AsyncStorage.getItem('user_token');
            if (storedToken) {
                const res = await api.get<AuthUser>('/users/me');
                setToken(storedToken);
                setUser(res.data);
            }
        } catch (e) {
            console.error(e);
            await logout();
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        void loadStoredAuth();
    }, [loadStoredAuth]);

    const login = async (email: string, pass: string) => {
        const res = await api.post<{ access_token: string }>('/auth/login', { email, password: pass });
        const accessToken = res.data.access_token;
        if (!accessToken) {
            throw new Error('The server did not return an access token.');
        }

        await AsyncStorage.setItem('user_token', accessToken);
        try {
            const userRes = await api.get<AuthUser>('/users/me');
            setToken(accessToken);
            setUser(userRes.data);
        } catch (error) {
            await AsyncStorage.removeItem('user_token');
            throw error;
        }
    };

    const register = async (email: string, pass: string) => {
        await api.post('/auth/register', { email, password: pass });
        await login(email, pass);
    };

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);