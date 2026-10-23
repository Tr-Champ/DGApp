import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { getApiErrorMessage } from '../../services/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            return Alert.alert('Missing Fields', 'Please enter both email and password.');
        }

        try {
            setLoading(true);
            await login(trimmedEmail, password);
            router.replace('/(tabs)/tab1');
        } catch (error: unknown) {
            Alert.alert(
                'Login Failed',
                getApiErrorMessage(error, 'Invalid email or password. Please try again.')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
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
                    {/* Branding Header */}
                    <View style={styles.brandContainer}>
                        <View style={styles.logoBadge}>
                            <Text style={styles.logoBadgeText}>D&G</Text>
                        </View>
                        <Text style={styles.brandSub}>Retail & E-Commerce</Text>
                    </View>

                    {/* Fenced Card Container */}
                    <View style={styles.fencedCard}>
                        <Text style={styles.cardTitle}>Welcome Back</Text>
                        <Text style={styles.cardSubtitle}>Sign in to access your account</Text>

                        <Text style={styles.fieldLabel}>Email Address</Text>
                        <Input
                            placeholder="e.g. user@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                        />

                        <Text style={styles.fieldLabel}>Password</Text>
                        <Input
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/forgot-password')}
                            style={styles.forgotContainer}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </TouchableOpacity>

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.loginBtn}
                        />
                    </View>

                    {/* Footer Switch */}
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/register')}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={styles.footerLink}>Register</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoBadge: {
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    logoBadgeText: {
        fontSize: 34,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 3,
    },
    brandSub: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textMuted,
        marginTop: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    fencedCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 8,
        marginBottom: 2,
    },
    forgotContainer: {
        alignSelf: 'flex-end',
        marginTop: 6,
        marginBottom: 14,
    },
    forgotText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    loginBtn: {
        borderRadius: 12,
        marginTop: 6,
        paddingVertical: 14,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
});
