import React, { useState } from 'react';
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

export default function RegisterScreen() {
    const router = useRouter();
    const { registerWithDevice } = useAuth();
    const { security } = useDeviceAuth();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            return Alert.alert('Missing Field', 'Please enter your email address to continue.');
        }

        // Basic email syntax check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return Alert.alert('Invalid Email', 'Please enter a valid email address (e.g. name@example.com).');
        }

        try {
            setLoading(true);
            await registerWithDevice(trimmedEmail);
            Alert.alert(
                'Registration Successful',
                'Your account has been created and bound to this device screen lock.',
                [
                    {
                        text: 'Go to Dashboard',
                        onPress: () => router.replace('/(tabs)/tab1'),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert(
                'Registration Failed',
                getApiErrorMessage(error, error?.message || 'Could not register account. Please try again.')
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
                        {/* Security Badge */}
                        <View style={styles.securityHeader}>
                            <View style={styles.securityBadge}>
                                <Ionicons name="key" size={13} color="#2563EB" />
                                <Text style={styles.securityBadgeText}>PASSWORDLESS ENROLLMENT</Text>
                            </View>
                        </View>

                        {/* Branding Header */}
                        <View style={styles.brandContainer}>
                            <Image
                                source={require('../../../assets/DGLoGo.jpg')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.brandTitle}>Create Your Account</Text>
                            <Text style={styles.brandSub}>Hardware-backed device lock registration</Text>
                        </View>

                        {/* Fenced Card Container */}
                        <View style={styles.fencedCard}>
                            <View style={styles.cardFenceTop} />

                            <Text style={styles.cardTitle}>One-Step Setup</Text>
                            <Text style={styles.cardSubtitle}>
                                Enter your email once. All future logins will simply use your phone lock (fingerprint, Face ID, or PIN/pattern).
                            </Text>

                            <Text style={styles.fieldLabel}>Email Address</Text>
                            <Input
                                placeholder="e.g. name@example.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                            />

                            {/* Security Highlights */}
                            <View style={styles.featureBox}>
                                <View style={styles.featureRow}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <Text style={styles.featureText}>No passwords to remember or lose</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <Text style={styles.featureText}>Hardware-encrypted with Android KeyStore</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <Text style={styles.featureText}>Fast 1-tap entry with system biometrics / PIN</Text>
                                </View>
                            </View>

                            {security.warningMessage && (
                                <View style={styles.warningBox}>
                                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                                    <Text style={styles.warningText}>{security.warningMessage}</Text>
                                </View>
                            )}

                            <Button
                                title={loading ? 'Confirming Phone Lock...' : 'Confirm Phone Lock & Register'}
                                onPress={handleRegister}
                                loading={loading}
                                style={styles.registerBtn}
                            />

                            <View style={styles.cardFenceBottom} />
                        </View>

                        {/* Footer Switch */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>Already registered on this phone? </Text>
                            <TouchableOpacity
                                onPress={() => router.replace('/(auth)/login')}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.footerLink}>Sign In</Text>
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
        backgroundColor: '#EFF6FF',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        gap: 6,
    },
    securityBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1D4ED8',
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
        letterSpacing: 1.2,
    },
    brandSub: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 3,
        letterSpacing: 0.6,
    },
    fencedCard: {
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
        marginBottom: 18,
        lineHeight: 18,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginTop: 4,
        marginBottom: 4,
    },
    featureBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        marginBottom: 6,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        padding: 10,
        borderRadius: 10,
        marginTop: 12,
        gap: 8,
    },
    warningText: {
        fontSize: 12,
        color: '#B91C1C',
        flex: 1,
        lineHeight: 16,
    },
    registerBtn: {
        borderRadius: 14,
        marginTop: 18,
        paddingVertical: 14,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
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