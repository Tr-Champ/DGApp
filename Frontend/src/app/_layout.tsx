import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

function RootLayoutNav() {
    const { token, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!token && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (token && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [token, isLoading, segments]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return <Slot />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <CartProvider>
                <RootLayoutNav />
            </CartProvider>
        </AuthProvider>
    );
}