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
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { getApiErrorMessage } from '../../services/api';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password || !confirmPassword) {
            return Alert.alert('Missing Fields', 'Please fill in all fields.');
        }
        if (password !== confirmPassword) {
            return Alert.alert('Password Mismatch', 'Passwords do not match. Please verify.');
        }
        if (password.length < 6) {
            return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
        }

        try {
            setLoading(true);
            await register(trimmedEmail, password);
            router.replace('/(tabs)/tab1');
        } catch (error: unknown) {
            Alert.alert(
                'Registration Failed',
                getApiErrorMessage(error, 'Could not create your account. Please try again.')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
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
                    <Text style={styles.brandSub}>Create Your Account</Text>
                </View>

                {/* Fenced Card Container */}
                <View style={styles.fencedCard}>
                    <Text style={styles.cardTitle}>Get Started</Text>
                    <Text style={styles.cardSubtitle}>Join our modern retail platform</Text>

                    <Text style={styles.fieldLabel}>Email Address</Text>
                    <Input
                        placeholder="e.g. name@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                    />

                    <Text style={styles.fieldLabel}>Password</Text>
                    <Input
                        placeholder="At least 6 characters"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Text style={styles.fieldLabel}>Confirm Password</Text>
                    <Input
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <Button
                        title="Create Account"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.registerBtn}
                    />
                </View>

                {/* Footer Switch */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity
                        onPress={() => router.replace('/(auth)/login')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.footerLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 32,
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
    registerBtn: {
        borderRadius: 12,
        marginTop: 18,
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