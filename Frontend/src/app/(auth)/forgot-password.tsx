import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        const trimmedEmail = email.trim();
        if (!trimmedEmail) return Alert.alert('Error', 'Please enter your email address');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) return Alert.alert('Error', 'Please enter a valid email address');

        try {
            setLoading(true);
            await api.post('/auth/forgot-password', { email: trimmedEmail });
            setSent(true);
        } catch (e: any) {
            const status = e.response?.status;
            if (status === 404 || status === 422) {
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
            <SafeAreaView style={styles.successContainer} edges={['top', 'left', 'right', 'bottom']}>
                <Text style={styles.successIcon}>✉️</Text>
                <Text style={styles.successTitle}>Check your email</Text>
                <Text style={styles.successText}>
                    If an account exists for <Text style={styles.emailHighlight}>{email}</Text>, you will receive password reset instructions shortly.
                </Text>
                <Button title="Back to Login" onPress={() => router.replace('/(auth)/login')} style={{ width: 220 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right', 'bottom']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={styles.brandContainer}>
                        <View style={styles.logoBadge}>
                            <Text style={styles.logoBadgeText}>D&G</Text>
                        </View>
                    </View>

                    <View style={styles.fencedCard}>
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>Enter your email and we'll send you reset instructions</Text>

                        <Text style={styles.fieldLabel}>Email Address</Text>
                        <Input
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Button title="Send Reset Link" onPress={handleReset} loading={loading} style={{ marginTop: 16 }} />

                        <TouchableOpacity onPress={() => router.back()} style={styles.backContainer}>
                            <Text style={styles.back}>← Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: '#F3F4F6' },
    container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    brandContainer: { alignItems: 'center', marginBottom: 20 },
    logoBadge: {
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 16,
        elevation: 4,
    },
    logoBadgeText: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
    fencedCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        elevation: 3,
    },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
    subtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 20, marginTop: 4, lineHeight: 18 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    backContainer: { alignItems: 'center', marginTop: 18 },
    back: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: Colors.background },
    successIcon: { fontSize: 64, marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 12, textAlign: 'center' },
    successText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    emailHighlight: { color: Colors.primary, fontWeight: 'bold' },
});
