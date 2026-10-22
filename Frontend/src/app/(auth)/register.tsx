import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) return Alert.alert('Error', 'Please fill all fields');
        if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
        if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
        try {
            setLoading(true);
            await register(email, password);
            router.replace('/(tabs)');
        } catch (e: any) {
            Alert.alert('Registration Failed', e.response?.data?.detail || 'Could not register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.brand}>D&G</Text>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join us and start shopping</Text>

                <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <Input placeholder="Password (min. 6 characters)" value={password} onChangeText={setPassword} secureTextEntry />
                <Input placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                <Button title="Create Account" onPress={handleRegister} loading={loading} />

                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
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
    link: { color: Colors.textMuted, textAlign: 'center', marginTop: 20, fontSize: 14 },
    linkBold: { color: Colors.primary, fontWeight: 'bold' },
});