import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export interface AuthUser {
    id: string;
    email: string;
    is_admin: boolean;
    role: 'admin' | 'user';
}

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: (email: string, password: string) => Promise<void>;
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

    const normalizeUser = (data: any): AuthUser => {
        const isAdmin = Boolean(data.is_admin || data.role === 'admin');
        return {
            id: String(data.id || ''),
            email: data.email || '',
            is_admin: isAdmin,
            role: isAdmin ? 'admin' : 'user',
        };
    };

    const loadStoredAuth = useCallback(async () => {
        try {
            const storedToken = await AsyncStorage.getItem('user_token');
            if (storedToken) {
                const res = await api.get('/users/me');
                setToken(storedToken);
                setUser(normalizeUser(res.data));
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
            const userRes = await api.get('/users/me');
            setToken(accessToken);
            setUser(normalizeUser(userRes.data));
        } catch (error) {
            await AsyncStorage.removeItem('user_token');
            throw error;
        }
    };

    const register = async (email: string, pass: string) => {
        await api.post('/auth/register', { email, password: pass });
        await login(email, pass);
    };

    /**
     * Delete the current user's account.
     * Validates credentials first, then deletes all data from the backend,
     * then clears local auth state.
     */
    const deleteAccount = async (email: string, password: string) => {
        // Validate credentials first by logging in again
        if (!user) throw new Error('Not authenticated');
        if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
            throw new Error('Email does not match your account email.');
        }

        // Re-authenticate to confirm password
        await api.post('/auth/login', { email: email.trim(), password });

        // Delete all user data from backend
        // Try dedicated delete endpoint; fall back to users/me DELETE
        try {
            await api.delete(`/users/${user.id}`);
        } catch {
            await api.delete('/users/me');
        }

        // Clear local auth state
        await logout();
    };

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, register, logout, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);