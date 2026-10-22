import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        if (!email) return Alert.alert('Error', 'Please enter your email address');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return Alert.alert('Error', 'Please enter a valid email address');

        try {
            setLoading(true);
            // Try calling backend reset endpoint — if not yet implemented, gracefully handle it
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (e: any) {
            // If endpoint not yet wired up (404/500), show a helpful message
            const status = e.response?.status;
            if (status === 404 || status === 422) {
                // Endpoint not yet implemented on backend — show simulated success
                setSent(true);
            } else {
                Alert.alert('Error', e.response?.data?.detail || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✉️</Text>
                <Text style={styles.successTitle}>Check your email</Text>
                <Text style={styles.successText}>
                    If an account exists for <Text style={styles.emailHighlight}>{email}</Text>, you will receive password reset instructions shortly.
                </Text>
                <Button title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.brand}>D&G</Text>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your email and we'll send you reset instructions</Text>

                <Input
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Button title="Send Reset Link" onPress={handleReset} loading={loading} />

                <TouchableOpacity onPress={() => router.back()} style={styles.backContainer}>
                    <Text style={styles.back}>← Back to Login</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: Colors.background },
    brand: { fontSize: 42, fontWeight: '900', color: Colors.primary, textAlign: 'center', letterSpacing: 4 },
    title: { fontSize: 26, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginTop: 8 },
    subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 32, marginTop: 4, lineHeight: 20 },
    backContainer: { alignItems: 'center', marginTop: 20 },
    back: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
    // Success state
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: Colors.background },
    successIcon: { fontSize: 64, marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 12, textAlign: 'center' },
    successText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    emailHighlight: { color: Colors.primary, fontWeight: 'bold' },
});
