import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Platform,
} from 'react-native';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function OfflineNotice() {
    const [isOffline, setIsOffline] = useState(false);
    const [checking, setChecking] = useState(false);

    const checkConnectivity = useCallback(async () => {
        try {
            if (Platform.OS === 'web') {
                setIsOffline(!navigator.onLine);
                return;
            }
            const state = await Network.getNetworkStateAsync();
            const offline = !state.isConnected || state.isInternetReachable === false;
            setIsOffline(offline);
        } catch (e) {
            console.warn('[OfflineNotice] Network check error:', e);
        }
    }, []);

    useEffect(() => {
        // Initial check on launch
        void checkConnectivity();

        // Polling interval to detect loss/restoration of internet
        const interval = setInterval(() => {
            void checkConnectivity();
        }, 4000);

        return () => clearInterval(interval);
    }, [checkConnectivity]);

    const handleRetry = async () => {
        setChecking(true);
        try {
            if (Platform.OS === 'web') {
                setIsOffline(!navigator.onLine);
            } else {
                const state = await Network.getNetworkStateAsync();
                const offline = !state.isConnected || state.isInternetReachable === false;
                setIsOffline(offline);
            }
        } finally {
            setChecking(false);
        }
    };

    if (!isOffline) return null;

    return (
        <Modal
            visible={isOffline}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    {/* Fence accent line at top */}
                    <View style={styles.topFenceLine} />

                    <View style={styles.iconContainer}>
                        <Ionicons name="cloud-offline" size={44} color="#EF4444" />
                    </View>

                    <Text style={styles.title}>No Internet Connection</Text>
                    <Text style={styles.message}>
                        D&G E-Commerce operates online-only. Please connect to Wi-Fi or enable mobile data to browse products and manage your account.
                    </Text>

                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={handleRetry}
                        disabled={checking}
                        activeOpacity={0.8}
                    >
                        {checking ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <View style={styles.btnContent}>
                                <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.retryBtnText}>Retry Connection</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Subtle bottom fence grid accent */}
                    <View style={styles.bottomFenceLine} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#FEE2E2',
    },
    topFenceLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#EF4444',
    },
    bottomFenceLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#FCA5A5',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 22,
    },
    retryBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
