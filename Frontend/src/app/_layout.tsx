import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

const SPLASH_DURATION = 3000;

function SplashScreen() {
    return (
        <View style={styles.splash}>
            <Image
                source={require('../../assets/splash.jpg')}
                style={styles.splashImage}
                resizeMode="cover"
            />
        </View>
    );
}

function RootLayoutNav() {
    const { token, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);

    // 3-second splash timer
    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION);
        return () => clearTimeout(timer);
    }, []);

    // Auth guard (triggers strictly after splash timer and auth resolution)
    useEffect(() => {
        if (showSplash || isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!token && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (token && inAuthGroup) {
            router.replace('/(tabs)/tab1');
        }
    }, [token, isLoading, segments, showSplash]);

    if (showSplash) return <SplashScreen />;

    if (isLoading) {
        return (
            <View style={styles.loader}>
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

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        backgroundColor: '#000000',
    },
    splashImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});