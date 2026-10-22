import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
        <View style={styles.container}>
            <Text style={styles.title}>D&G E-Commerce</Text>
            <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <Button title="Login" onPress={handleLogin} loading={loading} />
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.link}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: Colors.background },
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginBottom: 30 },
    link: { color: Colors.primary, textAlign: 'center', marginTop: 15, fontSize: 14 }
});