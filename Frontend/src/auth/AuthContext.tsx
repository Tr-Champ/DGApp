import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi, AUTH_STORAGE_KEY, DEVICE_LOCK_KEY, UserSession } from '../api/client';
import { checkDeviceSecurity, authenticateWithDeviceLock } from './deviceAuth';

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  isLocked: boolean;
  isDeviceLockSupported: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  unlockWithDevice: () => Promise<boolean>;
  lockApp: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isDeviceLockSupported, setIsDeviceLockSupported] = useState<boolean>(false);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      // 1. Check device biometric/lock capabilities
      const security = await checkDeviceSecurity();
      setIsDeviceLockSupported(security.canAuthenticate);

      // 2. Restore saved session
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token && parsed.user) {
          setToken(parsed.token);
          setUser(parsed.user);

          // If device security is configured, lock app initially for security
          if (security.canAuthenticate) {
            setIsLocked(true);
          }
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Bootstrap error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const data = await loginApi(username, password);
    const sessionUser: UserSession = {
      user_id: data.user_id,
      username: data.username,
      role: data.role,
      teacher_id: data.teacher_id,
      teacher_name: data.teacher_name,
    };
    const sessionToken: string = data.access_token;

    setToken(sessionToken);
    setUser(sessionUser);
    setIsLocked(false);

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: sessionToken, user: sessionUser })
    );
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setIsLocked(false);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const unlockWithDevice = async (): Promise<boolean> => {
    const result = await authenticateWithDeviceLock('Confirm phone lock to access Teacher Timetable');
    if (result.success) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (isDeviceLockSupported) {
      setIsLocked(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isLocked,
        isDeviceLockSupported,
        login,
        logout,
        unlockWithDevice,
        lockApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
