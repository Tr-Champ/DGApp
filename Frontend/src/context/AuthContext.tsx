import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface AuthContextType {
    token: string | null;
    user: any | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('user_token');
            if (storedToken) {
                setToken(storedToken);
                const res = await api.get('/users/me');
                setUser(res.data);
            }
        } catch (e) {
            console.error(e);
            await logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, pass: string) => {
        const res = await api.post('/auth/login', { email, password: pass });
        const accessToken = res.data.access_token;
        await AsyncStorage.setItem('user_token', accessToken);
        setToken(accessToken);
        const userRes = await api.get('/users/me');
        setUser(userRes.data);
    };

    const register = async (email: string, pass: string) => {
        await api.post('/auth/register', { email, password: pass });
        await login(email, pass);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('user_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);