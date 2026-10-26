import { useState, useEffect, useCallback } from 'react';
import {
    checkDeviceSecurity,
    promptDeviceAuthentication,
    getStoredDeviceToken,
    saveDeviceToken,
    clearStoredDeviceToken,
    generateDeviceToken,
    DeviceSecurityCheck,
} from '../services/deviceAuthService';

export function useDeviceAuth() {
    const [security, setSecurity] = useState<DeviceSecurityCheck>({
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        canAuthenticate: false,
    });
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
    const [deviceToken, setDeviceToken] = useState<string | null>(null);

    const refreshSecurity = useCallback(async () => {
        const sec = await checkDeviceSecurity();
        setSecurity(sec);
        const stored = await getStoredDeviceToken();
        setDeviceToken(stored);
        return sec;
    }, []);

    useEffect(() => {
        void refreshSecurity();
    }, [refreshSecurity]);

    const authenticate = useCallback(
        async (promptMessage?: string): Promise<{ success: boolean; error?: string }> => {
            setIsAuthenticating(true);
            try {
                const res = await promptDeviceAuthentication(promptMessage);
                return res;
            } finally {
                setIsAuthenticating(false);
            }
        },
        []
    );

    const storeNewDeviceToken = useCallback(async (token?: string): Promise<string> => {
        const tokenToSave = token || generateDeviceToken();
        await saveDeviceToken(tokenToSave);
        setDeviceToken(tokenToSave);
        return tokenToSave;
    }, []);

    const removeDeviceToken = useCallback(async () => {
        await clearStoredDeviceToken();
        setDeviceToken(null);
    }, []);

    return {
        security,
        isAuthenticating,
        deviceToken,
        hasDeviceToken: Boolean(deviceToken),
        refreshSecurity,
        authenticate,
        storeNewDeviceToken,
        removeDeviceToken,
        generateDeviceToken,
    };
}
