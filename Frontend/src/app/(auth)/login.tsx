import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useDeviceAuth } from '../../hooks/useDeviceAuth';
import FenceLineFrame from '../../components/FenceLineFrame';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { getApiErrorMessage } from '../../services/api';

export default function LoginScreen() {
    const router = useRouter();
    const { loginWithDevice, rebindDeviceWithLock, deviceToken } = useAuth();
    const { security, refreshSecurity } = useDeviceAuth();

    const [isRebindMode, setIsRebindMode] = useState(false);
    const [rebindEmail, setRebindEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasAttemptedAutoPrompt, setHasAttemptedAutoPrompt] = useState(false);

    // Primary action: Authenticate with current active phone lock (Biometrics / PIN / Pattern)
    const handleDeviceUnlock = useCallback(async () => {
        try {
            setLoading(true);
            await loginWithDevice();
            router.replace('/(tabs)/tab1');
        } catch (error: any) {
            if (error?.message === 'NO_DEVICE_TOKEN') {
                // Device not yet registered or storage cleared
                setIsRebindMode(true);
                Alert.alert(
                    'No Linked Account',
                    'This device is not yet linked. Enter your email to claim/rebind this phone, or tap Register below.'
                );
            } else {
                Alert.alert(
                    'Authentication',
                    getApiErrorMessage(error, error?.message || 'Device authentication could not be completed.')
                );
            }
        } finally {
            setLoading(false);
        }
    }, [loginWithDevice, router]);

    // Auto-prompt device lock on initial screen launch if device is already registered
    useEffect(() => {
        let isMounted = true;
        const autoPrompt = async () => {
            if (!hasAttemptedAutoPrompt && deviceToken) {
                setHasAttemptedAutoPrompt(true);
                // Wait slightly for UI mount transition
                setTimeout(() => {
                    if (isMounted) {
                        void handleDeviceUnlock();
                    }
                }, 400);
            }
        };
        void autoPrompt();
        return () => {
            isMounted = false;
        };
    }, [deviceToken, hasAttemptedAutoPrompt, handleDeviceUnlock]);

    // Handle account rebind for new phone or cleared cache
    const handleRebind = async () => {
        const cleanEmail = rebindEmail.trim();
        if (!cleanEmail) {
            return Alert.alert('Email Required', 'Please enter your registered account email.');
        }

        try {
            setLoading(true);
            await rebindDeviceWithLock(cleanEmail);
            Alert.alert('Device Linked', 'Your account was successfully linked to this phone.', [
                {
                    text: 'Continue',
                    onPress: () => router.replace('/(tabs)/tab1'),
                },
            ]);
        } catch (error: any) {
            Alert.alert(
                'Linking Failed',
                getApiErrorMessage(error, error?.message || 'Could not link this device to the specified email.')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <FenceLineFrame color={Colors.primary}>
            <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right', 'bottom']}>
                <KeyboardAvoidingView
                    style={styles.keyboardContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header Security Status Badge */}
                        <View style={styles.securityHeader}>
                            <View style={styles.securityBadge}>
                                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                                <Text style={styles.securityBadgeText}>HARDWARE-ENCRYPTED LOCK</Text>
                            </View>
                        </View>

                        {/* Branding Header */}
                        <View style={styles.brandContainer}>
                            <Image
                                source={require('../../../assets/DGLoGo.jpg')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.brandTitle}>D&G E-COMMERCE</Text>
                            <Text style={styles.brandSub}>Device Lock Authentication</Text>
                        </View>

                        {/* Main Vault Auth Card */}
                        <View style={styles.vaultCard}>
                            {/* Inner fence line accents on card */}
                            <View style={styles.cardFenceTop} />

                            {!isRebindMode ? (
                                <>
                                    {/* Normal Login: Pure Phone Lock */}
                                    <View style={styles.biometricCircleOuter}>
                                        <View style={styles.biometricCircleInner}>
                                            <Ionicons name="finger-print" size={54} color={Colors.primary} />
                                        </View>
                                    </View>

                                    <Text style={styles.cardTitle}>Unlock with Phone Lock</Text>
                                    <Text style={styles.cardSubtitle}>
                                        Touch sensor, use Face ID, or enter your device PIN/Pattern
                                    </Text>

                                    {security.warningMessage && (
                                        <View style={styles.warningBox}>
                                            <Ionicons name="alert-circle" size={16} color="#DC2626" />
                                            <Text style={styles.warningText}>{security.warningMessage}</Text>
                                        </View>
                                    )}

                                    <Button
                                        title={loading ? 'Verifying Lock...' : 'Unlock Account'}
                                        onPress={handleDeviceUnlock}
                                        loading={loading}
                                        style={styles.unlockBtn}
                                    />

                                    {/* Switch to Rebind / New Phone Mode */}
                                    <TouchableOpacity
                                        style={styles.switchModeContainer}
                                        onPress={() => setIsRebindMode(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="phone-portrait-outline" size={16} color={Colors.primary} />
                                        <Text style={styles.switchModeText}>New Phone or Re-link Account?</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    {/* Rebind / Recovery Flow for New Phones */}
                                    <View style={styles.rebindIconContainer}>
                                        <Ionicons name="swap-horizontal" size={32} color={Colors.primary} />
                                    </View>

                                    <Text style={styles.cardTitle}>Claim / Rebind Device</Text>
                                    <Text style={styles.cardSubtitle}>
                                        Link your existing account to this phone using your active screen lock
                                    </Text>

                                    <Text style={styles.fieldLabel}>Account Email</Text>
                                    <Input
                                        placeholder="e.g. name@example.com"
                                        value={rebindEmail}
                                        onChangeText={setRebindEmail}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                    />

                                    <Button
                                        title={loading ? 'Confirming Lock...' : 'Verify Phone Lock & Link'}
                                        onPress={handleRebind}
                                        loading={loading}
                                        style={styles.unlockBtn}
                                    />

                                    <TouchableOpacity
                                        style={styles.switchModeContainer}
                                        onPress={() => setIsRebindMode(false)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="arrow-back" size={16} color={Colors.textMuted} />
                                        <Text style={[styles.switchModeText, { color: Colors.textMuted }]}>
                                            Back to Standard Unlock
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            <View style={styles.cardFenceBottom} />
                        </View>

                        {/* Footer Switch to Register */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>New to D&G? </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(auth)/register')}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.footerLink}>Register New Device</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </FenceLineFrame>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingVertical: 24,
    },
    securityHeader: {
        alignItems: 'center',
        marginBottom: 12,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        gap: 6,
    },
    securityBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#065F46',
        letterSpacing: 1.2,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoImage: {
        width: 88,
        height: 88,
        borderRadius: 22,
        marginBottom: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    brandTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1.5,
    },
    brandSub: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 3,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    vaultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 24,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    cardFenceTop: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        height: 3,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    cardFenceBottom: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        height: 3,
        backgroundColor: '#CBD5E1',
        borderRadius: 2,
    },
    biometricCircleOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EFF6FF',
        borderWidth: 2,
        borderColor: '#BFDBFE',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 18,
    },
    biometricCircleInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rebindIconContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#BFDBFE',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 20,
        lineHeight: 18,
        paddingHorizontal: 8,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginTop: 4,
        marginBottom: 4,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
    },
    warningText: {
        fontSize: 12,
        color: '#B91C1C',
        flex: 1,
        lineHeight: 16,
    },
    unlockBtn: {
        borderRadius: 14,
        marginTop: 8,
        paddingVertical: 14,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    switchModeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        gap: 6,
        paddingVertical: 4,
    },
    switchModeText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        color: '#64748B',
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.primary,
    },
});
