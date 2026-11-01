import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider } from '../context/LanguageContext';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import OfflineNotice from '../components/OfflineNotice';

const SPLASH_DURATION = 1800; // Snappy, modern splash duration

function SplashScreen() {
    return (
        <View style={styles.splash}>
            <View style={styles.splashCenter}>
                <View style={styles.logoWrapper}>
                    <Image
                        source={require('../../assets/DGLoGo.jpg')}
                        style={styles.splashLogo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.splashBrand}>D&G E-COMMERCE</Text>
                <Text style={styles.splashTagline}>Premium Retail & Fast Delivery</Text>
            </View>
            <View style={styles.splashFooter}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.splashLoadingText}>Loading your experience...</Text>
            </View>
        </View>
    );
}

function RootLayoutNav() {
    const { token, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);

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

    return (
        <>
            <StatusBar style="light" />
            <OfflineNotice />
            <Slot />
        </>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <LanguageProvider>
                <AuthProvider>
                    <CartProvider>
                        <RootLayoutNav />
                    </CartProvider>
                </AuthProvider>
            </LanguageProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        backgroundColor: '#0F172A', // Modern deep midnight obsidian
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    splashCenter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoWrapper: {
        width: 120,
        height: 120,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        overflow: 'hidden',
    },
    splashLogo: {
        width: 110,
        height: 110,
        borderRadius: 25,
    },
    splashBrand: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginBottom: 6,
    },
    splashTagline: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    splashFooter: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
        gap: 10,
    },
    splashLoadingText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});
