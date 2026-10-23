import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert
} from 'react-native';
import api from '../../services/api';
import { Colors } from '../../constants/Colors';

interface Order {
    id: string;
    total_price: number;
    delivered: boolean;
    items: any[];
    user_id?: string;
    created_at?: string;
}

type FilterTab = 'all' | 'pending' | 'delivered';

export default function AdminConfirmOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    const fetchOrders = useCallback(async () => {
        try {
            let data: Order[] = [];
            try {
                const res = await api.get('/orders/all');
                data = res.data || [];
            } catch {
                const fallback = await api.get('/orders/');
                data = fallback.data || [];
            }
            setOrders(data);
        } catch (e) {
            console.error('Error fetching admin orders', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const handleConfirm = async (order: Order) => {
        Alert.alert(
            'Confirm Order Delivery',
            `Are you sure you want to mark order #${order.id.slice(0, 8)} as delivered?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark Delivered',
                    onPress: async () => {
                        try {
                            setConfirmingId(order.id);
                            await api.patch(`/orders/${order.id}/deliver`);
                            Alert.alert('Success', 'Order marked as delivered!');
                            fetchOrders();
                        } catch (e: any) {
                            Alert.alert(
                                'Error',
                                e.response?.data?.detail || 'Failed to update delivery status.'
                            );
                        } finally {
                            setConfirmingId(null);
                        }
                    },
                },
            ]
        );
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

    const pendingOrders = orders.filter((o) => !o.delivered);
    const deliveredOrders = orders.filter((o) => o.delivered);

    const filteredOrders =
        activeFilter === 'pending'
            ? pendingOrders
            : activeFilter === 'delivered'
            ? deliveredOrders
            : orders;

    return (
        <View style={styles.container}>
            {/* Filter Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabButton, activeFilter === 'all' && styles.activeTabButton]}
                    onPress={() => setActiveFilter('all')}
                >
                    <Text style={[styles.tabText, activeFilter === 'all' && styles.activeTabText]}>
                        All ({orders.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeFilter === 'pending' && styles.activeTabButton]}
                    onPress={() => setActiveFilter('pending')}
                >
                    <Text style={[styles.tabText, activeFilter === 'pending' && styles.activeTabText]}>
                        Pending ({pendingOrders.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeFilter === 'delivered' && styles.activeTabButton]}
                    onPress={() => setActiveFilter('delivered')}
                >
                    <Text style={[styles.tabText, activeFilter === 'delivered' && styles.activeTabText]}>
                        Delivered ({deliveredOrders.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                }
                contentContainerStyle={{ paddingBottom: 24 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No Orders Found</Text>
                        <Text style={styles.emptySubtitle}>
                            There are currently no orders in this category.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const priceNum = parseFloat(item.total_price as any || 0);
                    const isConfirming = confirmingId === item.id;

                    return (
                        <View style={[styles.card, item.delivered && styles.deliveredCard]}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
                                    {item.created_at && (
                                        <Text style={styles.dateText}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: item.delivered ? Colors.success : Colors.secondary },
                                    ]}
                                >
                                    <Text style={styles.statusBadgeText}>
                                        {item.delivered ? 'Delivered' : 'Pending'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.detailsRow}>
                                <Text style={styles.itemCount}>
                                    📦 {Array.isArray(item.items) ? item.items.length : 0} items
                                </Text>
                                <Text style={styles.priceText}>${priceNum.toFixed(2)}</Text>
                            </View>

                            {/* Render items breakdown preview if available */}
                            {Array.isArray(item.items) && item.items.length > 0 && (
                                <View style={styles.itemsPreview}>
                                    {item.items.map((prod: any, idx: number) => (
                                        <Text key={idx} style={styles.itemLine} numberOfLines={1}>
                                            • {prod.name || 'Product'} × {prod.quantity || 1}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {!item.delivered && (
                                <TouchableOpacity
                                    style={[styles.confirmBtn, isConfirming && styles.btnDisabled]}
                                    onPress={() => handleConfirm(item)}
                                    disabled={isConfirming}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.confirmBtnText}>
                                        {isConfirming ? 'Updating Status...' : '✓ Confirm & Mark as Delivered'}
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
    container: { flex: 1, backgroundColor: Colors.background },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    activeTabButton: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMuted,
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 14,
        marginTop: 12,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    deliveredCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.success,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderId: { fontSize: 15, fontWeight: '800', color: Colors.text },
    dateText: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 11,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 10,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemCount: { fontSize: 13, color: Colors.textMuted },
    priceText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
    itemsPreview: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderColor: '#F3F4F6',
    },
    itemLine: {
        fontSize: 12,
        color: Colors.textMuted,
        marginVertical: 1,
    },
    confirmBtn: {
        backgroundColor: Colors.success,
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 12,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    emptySubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 4,
        textAlign: 'center',
    },
});
