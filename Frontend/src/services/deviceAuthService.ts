import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_TOKEN_KEY = 'dg_device_token';
const OFFLINE_SESSION_KEY = 'dg_offline_session';
const JWT_TOKEN_KEY = 'user_token';

// Android Keystore hardware encryption options
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

export interface DeviceSecurityCheck {
    hasHardware: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
    canAuthenticate: boolean;
    warningMessage?: string;
}

/**
 * 1. Checks if the device has biometric or screen lock hardware,
 * and whether at least one screen lock (PIN, Pattern, Fingerprint, Face ID) is active.
 */
export async function checkDeviceSecurity(): Promise<DeviceSecurityCheck> {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        let warningMessage: string | undefined;

        if (!isEnrolled) {
            warningMessage =
                'Please set up a Screen Lock (PIN, Pattern, or Fingerprint) in your device settings to continue.';
        }

        return {
            hasHardware,
            isEnrolled,
            supportedTypes,
            canAuthenticate: isEnrolled,
            warningMessage,
        };
    } catch (error) {
        console.warn('[DeviceAuth] Security check error:', error);
        // Fallback for custom ROMs / web
        return {
            hasHardware: false,
            isEnrolled: false,
            supportedTypes: [],
            canAuthenticate: false,
            warningMessage:
                'Unable to query device security. Please ensure a Screen Lock is configured in settings.',
        };
    }
}

/**
 * 2. Authenticates using native hardware prompt (Biometric / Face / Fingerprint)
 * with mandatory system PIN / Pattern fallback enabled (disableDeviceFallback: false).
 */
export async function promptDeviceAuthentication(
    promptMessage = 'Confirm your phone lock to continue'
): Promise<{ success: boolean; error?: string }> {
    try {
        const security = await checkDeviceSecurity();

        if (!security.isEnrolled && Platform.OS !== 'web') {
            return {
                success: false,
                error:
                    security.warningMessage ||
                    'Please set up a Screen Lock (PIN, Pattern, or Fingerprint) in your device settings to continue.',
            };
        }

        // Trigger native biometric prompt with system fallback for Android 10+ / Samsung / Xiaomi / iOS
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            fallbackLabel: 'Use Device PIN / Pattern',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false, // MANDATORY: Falls back to PIN/Pattern/Password on Android
        });

        if (result.success) {
            return { success: true };
        }

        let userError = 'Authentication cancelled or failed.';
        if (result.error === 'user_cancel' || result.error === 'system_cancel') {
            userError = 'Authentication was cancelled.';
        } else if (result.error === 'not_enrolled') {
            userError = 'Please set up a Screen Lock (PIN, Pattern, or Fingerprint) in your device settings to continue.';
        } else if (result.error === 'lockout') {
            userError = 'Too many failed attempts. Please unlock with your phone PIN / Pattern.';
        }

        return {
            success: false,
            error: userError,
        };
    } catch (err: any) {
        console.error('[DeviceAuth] BiometricPrompt exception:', err);
        return {
            success: false,
            error: err?.message || 'Biometric authentication encountered an error. Please try again.',
        };
    }
}

/**
 * 3. Secure Storage: Store the long-lived device_token hardware-encrypted in Android Keystore / iOS Keychain.
 */
export async function saveDeviceToken(token: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, token, SECURE_STORE_OPTIONS);
    } catch (e) {
        console.warn('[DeviceAuth] SecureStore write fallback to AsyncStorage:', e);
        await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
    }
}

export async function getStoredDeviceToken(): Promise<string | null> {
    try {
        const secureToken = await SecureStore.getItemAsync(DEVICE_TOKEN_KEY, SECURE_STORE_OPTIONS);
        if (secureToken) return secureToken;
    } catch (e) {
        console.warn('[DeviceAuth] SecureStore read fallback to AsyncStorage:', e);
    }
    return await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
}

export async function clearStoredDeviceToken(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(DEVICE_TOKEN_KEY, SECURE_STORE_OPTIONS);
    } catch {
        // ignore
    }
    await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
}

/**
 * 4. Generate cryptographically secure random UUID for device_token.
 */
export function generateDeviceToken(): string {
    return Crypto.randomUUID();
}

/**
 * 5. Offline caching: Cache JWT and user profile locally so phone lock allows offline app entry.
 */
export async function cacheOfflineSession(token: string, user: any): Promise<void> {
    try {
        const payload = JSON.stringify({ token, user, timestamp: Date.now() });
        await AsyncStorage.setItem(OFFLINE_SESSION_KEY, payload);
    } catch (err) {
        console.warn('[DeviceAuth] Failed to cache offline session:', err);
    }
}

export async function getCachedOfflineSession(): Promise<{ token: string; user: any } | null> {
    try {
        const raw = await AsyncStorage.getItem(OFFLINE_SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export async function clearOfflineSession(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_SESSION_KEY);
}
