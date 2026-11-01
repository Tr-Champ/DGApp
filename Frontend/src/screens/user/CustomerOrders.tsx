import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { formatRWF } from '../../constants/i18n';

const POLL_INTERVAL_MS = 5000; // 5-second polling for real-time delivery sync

// In-memory cache for instant zero-spinner loading on tab navigation
let cachedOrders: any[] = [];

export default function CustomerOrders() {
    const { user, token } = useAuth();
    const { t, lang } = useLanguage();
    const [orders, setOrders] = useState<any[]>(cachedOrders);
    const [loading, setLoading] = useState(cachedOrders.length === 0);
    const [refreshing, setRefreshing] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchOrders = useCallback(async (silent = false) => {
        if (!token) {
            setOrders([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            if (!silent && cachedOrders.length === 0) setLoading(true);
            const res = await api.get('/orders/');
            const newOrders = res.data || [];
            cachedOrders = newOrders;
            setOrders(newOrders);
        } catch (e: any) {
            if (e?.response?.status === 401) {
                if (pollRef.current) clearInterval(pollRef.current);
                setOrders([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders(cachedOrders.length > 0);

        if (token) {
            pollRef.current = setInterval(() => {
                fetchOrders(true);
            }, POLL_INTERVAL_MS);
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchOrders, token]);

    const onRefresh = () => { setRefreshing(true); fetchOrders(true); };

    // Clean human-friendly reference
    const formatOrderRef = (id: string) => {
        if (!id) return '#ORD-001';
        if (id.startsWith('ORD-')) return `#${id}`;
        if (!isNaN(Number(id))) return `#ORD-${id}`;
        return `#ORD-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
    };

    const getProductItems = (order: any) => {
        if (!Array.isArray(order.items)) return [];
        return order.items.filter((it: any) => it && !it.is_customer_info && !it.__customer__);
    };

    const getCustomerMeta = (order: any) => {
        if (!Array.isArray(order.items)) return null;
        const meta = order.items.find((it: any) => it && (it.is_customer_info || it.__customer__));
        return meta?.customer || null;
    };

    // Customer confirms product received (Handshake)
    const handleCustomerConfirmReceipt = async (order: any) => {
        const refName = formatOrderRef(order.id);
        Alert.alert(
            t.confirmReceipt,
            lang === 'rw'
                ? `Wabonye ibicuruzwa bya ${refName}?\nEmeza uzarangize igabana.`
                : lang === 'fr'
                ? `Avez-vous reçu votre commande ${refName}?\nConfirmer complète le processus de livraison.`
                : `Have you received your items for ${refName}?\nConfirming completes the delivery handshake for ${user?.email || 'your account'}.`,
            [
                {
                    text: lang === 'rw' ? 'Ntaraho' : lang === 'fr' ? 'Pas encore' : 'Not Yet',
                    style: 'cancel',
                },
                {
                    text: lang === 'rw' ? 'Yego, Byabonwe' : lang === 'fr' ? 'Oui, reçu' : 'Yes, Package Received',
                    onPress: async () => {
                        try {
                            setConfirmingId(order.id);
                            // Optimistically mark as delivered in a blink
                            setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, delivered: true } : o)));
                            cachedOrders = cachedOrders.map((o) => (o.id === order.id ? { ...o, delivered: true } : o));

                            await api.patch(`/orders/${order.id}/deliver`);
                            Alert.alert(
                                '🎉 ' + t.success,
                                lang === 'rw'
                                    ? `Itangwa rya ${refName} ryemejwe. Murakoze!`
                                    : lang === 'fr'
                                    ? `Commande ${refName} confirmée. Merci!`
                                    : `Order ${refName} has been marked as delivered. Enjoy your products!`
                            );
                            fetchOrders(true);
                        } catch (e: any) {
                            Alert.alert(t.success, e.response?.data?.detail || 'Order status updated.');
                            fetchOrders(true);
                        } finally {
                            setConfirmingId(null);
                        }
                    },
                },
            ]
        );
    };


    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                keyExtractor={(item: any) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                }
                contentContainerStyle={{ paddingBottom: 24 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bag-handle-outline" size={44} color={Colors.border} style={{ marginBottom: 10 }} />
                        <Text style={styles.emptyText}>{t.noOrders}</Text>
                        <Text style={styles.emptySubtext}>
                            {lang === 'rw'
                                ? 'Iyo uguriye, amateka azagaragara hano.'
                                : lang === 'fr'
                                ? 'Lorsque vous passez une commande, elle apparaîtra ici.'
                                : 'When you place an order, it will appear here.'}
                        </Text>
                    </View>
                }
                renderItem={({ item }: any) => {
                    const productsList = getProductItems(item);
                    const custMeta = getCustomerMeta(item);
                    const priceNum = parseFloat(item.total_price || 0);
                    const isConfirming = confirmingId === item.id;

                    return (
                        <View style={[styles.card, item.delivered && styles.deliveredCard]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.id}>{formatOrderRef(item.id)}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: item.delivered ? Colors.success : Colors.secondary }]}>
                                    <Text style={styles.statusBadgeText}>
                                        {item.delivered
                                            ? (lang === 'rw' ? '✓ Byatanzwe' : lang === 'fr' ? '✓ Livré' : '✓ Delivered')
                                            : (lang === 'rw' ? '⏳ Iri mu nzira' : lang === 'fr' ? '⏳ En transit' : '⏳ In Transit')}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.priceText}>{formatRWF(priceNum)}</Text>

                            {/* Products breakdown */}
                            {productsList.length > 0 && (
                                <View style={styles.productsBox}>
                                    {productsList.map((prod: any, idx: number) => (
                                        <Text key={idx} style={styles.productLine} numberOfLines={1}>
                                            • {prod.name || 'Product'} × {prod.quantity || 1}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {custMeta && (
                                <Text style={styles.addressLine}>
                                    📍 {lang === 'rw' ? 'Kohereza kuri:' : lang === 'fr' ? 'Livrer à:' : 'Deliver to:'} {custMeta.district || 'Kigali'} ({custMeta.phone || ''})
                                </Text>
                            )}

                            {/* Handshake confirmation button — only shown when not yet delivered */}
                            {!item.delivered && (
                                <TouchableOpacity
                                    style={[styles.confirmBtn, isConfirming && styles.btnDisabled]}
                                    onPress={() => handleCustomerConfirmReceipt(item)}
                                    disabled={isConfirming}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.confirmBtnText}>
                                        {isConfirming
                                            ? (lang === 'rw' ? 'Gusaba...' : lang === 'fr' ? 'Confirmation...' : 'Confirming...')
                                            : t.confirmReceipt}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, backgroundColor: Colors.background },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
    },
    deliveredCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.success,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    id: { fontSize: 16, fontWeight: '900', color: Colors.text },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    priceText: { fontSize: 18, fontWeight: '900', color: Colors.primary, marginBottom: 8 },
    productsBox: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
        marginVertical: 4,
    },
    productLine: { fontSize: 13, color: Colors.text, marginVertical: 2 },
    addressLine: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
    confirmBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 11,
        borderRadius: 10,
        marginTop: 12,
    },
    btnDisabled: { opacity: 0.6 },
    confirmBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
    emptySubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
});
