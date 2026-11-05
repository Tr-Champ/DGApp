import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface DeviceSecurityStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  canAuthenticate: boolean;
}

/**
 * Checks if the device has biometric or screen lock hardware and has at least
 * one lock enrolled (PIN, Pattern, Password, Fingerprint, or Face).
 */
export async function checkDeviceSecurity(): Promise<DeviceSecurityStatus> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return {
      hasHardware,
      isEnrolled,
      canAuthenticate: isEnrolled,
    };
  } catch (err) {
    console.warn('[DeviceAuth] checkDeviceSecurity error:', err);
    return {
      hasHardware: false,
      isEnrolled: false,
      canAuthenticate: false,
    };
  }
}

/**
 * Triggers native system lock screen prompt (Fingerprint, Face, or PIN/Pattern/Password fallback).
 */
export async function authenticateWithDeviceLock(
  promptMessage = 'Unlock Teacher Timetable Manager'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS === 'web') {
      return { success: true };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      // Device does not have any screen lock configured
      return {
        success: false,
        error: 'No phone screen lock (PIN/Pattern/Fingerprint) is enrolled on this device.',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Device PIN / Pattern / Password',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Ensures fallback to screen PIN/pattern/password if fingerprint isn't used
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Authentication cancelled or failed',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to authenticate with phone lock',
    };
  }
}
