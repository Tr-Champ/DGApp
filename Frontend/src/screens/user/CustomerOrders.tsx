import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';

export default function CustomerOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await api.get('/orders/');
            setOrders(res.data || []);
        } catch (e) {
            console.error('Failed to load customer orders', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

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
            'Confirm Product Delivery',
            `Have you received your items for ${refName}?\nConfirming completes the delivery handshake for ${user?.email || 'your account'}.`,
            [
                { text: 'Not Yet', style: 'cancel' },
                {
                    text: 'Yes, Package Received',
                    onPress: async () => {
                        try {
                            setConfirmingId(order.id);
                            await api.patch(`/orders/${order.id}/deliver`);
                            Alert.alert('🎉 Delivery Confirmed', `Order ${refName} has been marked as delivered. Enjoy your products!`);
                            fetchOrders();
                        } catch (e: any) {
                            Alert.alert('Notice', e.response?.data?.detail || 'Order status updated.');
                            fetchOrders();
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
                        <Text style={styles.emptyText}>No orders placed yet.</Text>
                        <Text style={styles.emptySubtext}>When you place an order, it will appear here.</Text>
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
                                        {item.delivered ? '✓ Delivered' : '⏳ In Transit'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.priceText}>${priceNum.toFixed(2)}</Text>

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
                                    📍 Deliver to: {custMeta.district || 'Kigali'} ({custMeta.phone || ''})
                                </Text>
                            )}

                            {/* Handshake confirmation button */}
                            {!item.delivered && (
                                <TouchableOpacity
                                    style={[styles.confirmBtn, isConfirming && styles.btnDisabled]}
                                    onPress={() => handleCustomerConfirmReceipt(item)}
                                    disabled={isConfirming}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.confirmBtnText}>
                                        {isConfirming ? 'Confirming...' : 'Confirm Product Delivered'}
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
