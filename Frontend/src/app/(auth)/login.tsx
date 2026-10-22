import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
        try {
            setLoading(true);
            await login(email, password);
            router.replace('/(tabs)');
        } catch (e: any) {
            Alert.alert('Login Failed', e.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.brand}>D&G</Text>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>

                <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotContainer}>
                    <Text style={styles.forgot}>Forgot Password?</Text>
                </TouchableOpacity>

                <Button title="Login" onPress={handleLogin} loading={loading} />

                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: Colors.background },
    brand: { fontSize: 42, fontWeight: '900', color: Colors.primary, textAlign: 'center', letterSpacing: 4 },
    title: { fontSize: 26, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginTop: 8 },
    subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 32, marginTop: 4 },
    forgotContainer: { alignSelf: 'flex-end', marginBottom: 4, marginTop: -4 },
    forgot: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
    link: { color: Colors.textMuted, textAlign: 'center', marginTop: 20, fontSize: 14 },
    linkBold: { color: Colors.primary, fontWeight: 'bold' },
});