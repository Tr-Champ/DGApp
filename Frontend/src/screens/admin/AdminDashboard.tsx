import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    RefreshControl, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';

interface OrderItem {
    id: string;
    total_price: number;
    delivered: boolean;
    items?: any[];
    created_at?: string;
}

interface Stats {
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    revenue: number;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats>({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        revenue: 0,
    });
    const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            let products: any[] = [];
            try {
                const pRes = await api.get('/products/');
                products = pRes.data || [];
            } catch (err) {
                console.warn('Products fetch error', err);
            }

            let orders: OrderItem[] = [];
            try {
                const oRes = await api.get('/orders/all');
                orders = oRes.data || [];
            } catch {
                try {
                    const fallbackRes = await api.get('/orders/');
                    orders = fallbackRes.data || [];
                } catch (e) {
                    console.warn('Orders fetch error', e);
                }
            }

            const pending = orders.filter((o) => !o.delivered).length;
            const delivered = orders.filter((o) => o.delivered).length;
            const revenue = orders
                .filter((o) => o.delivered)
                .reduce((sum: number, o: any) => sum + (parseFloat(o.total_price) || 0), 0);

            setStats({
                totalProducts: products.length,
                totalOrders: orders.length,
                pendingOrders: pending,
                deliveredOrders: delivered,
                revenue,
            });

            setRecentOrders(orders.slice(0, 5));
        } catch (e) {
            console.error('Dashboard fetch error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const onRefresh = () => { setRefreshing(true); fetchStats(); };

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;
    }

    const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Ionicons name={icon as any} size={28} color={color} style={styles.statIcon} />
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </View>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Welcome, Admin 👑</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            <Text style={styles.sectionTitle}>Store Performance</Text>
            <View style={styles.statsGrid}>
                <StatCard icon="cube-outline" label="Products" value={stats.totalProducts} color={Colors.primary} />
                <StatCard icon="receipt-outline" label="Total Orders" value={stats.totalOrders} color="#1E40AF" />
                <StatCard icon="time-outline" label="Pending Orders" value={stats.pendingOrders} color={Colors.secondary} />
                <StatCard icon="checkmark-circle-outline" label="Delivered" value={stats.deliveredOrders} color={Colors.success} />
                <StatCard icon="cash-outline" label="Revenue" value={`$${stats.revenue.toFixed(2)}`} color="#7C3AED" />
            </View>

            {/* Recent Order Notifications */}
            <Text style={styles.sectionTitle}>Recent Customer Orders</Text>
            <View style={styles.recentOrdersContainer}>
                {recentOrders.length === 0 ? (
                    <Text style={styles.emptyText}>No recent orders available.</Text>
                ) : (
                    recentOrders.map((ord) => (
                        <View key={ord.id} style={styles.orderNotification}>
                            <View style={styles.orderNotifHeader}>
                                <Text style={styles.orderNotifId}>Order #{ord.id.startsWith('ORD-') ? ord.id.replace('ORD-', '') : ord.id.replace(/-/g, '').slice(0, 5).toUpperCase()}</Text>
                                <View style={[styles.badge, { backgroundColor: ord.delivered ? Colors.success : Colors.secondary }]}>
                                    <Text style={styles.badgeText}>{ord.delivered ? 'Delivered' : 'Pending'}</Text>
                                </View>
                            </View>
                            <Text style={styles.orderNotifDetails}>
                                Total: ${parseFloat(ord.total_price as any || 0).toFixed(2)} · {Array.isArray(ord.items) ? ord.items.length : 0} items
                            </Text>
                        </View>
                    ))
                )}
            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.primary,
        padding: 24,
        paddingTop: 18,
    },
    greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    email: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textMuted,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsGrid: { paddingHorizontal: 16, gap: 10 },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    statIcon: { marginRight: 16 },
    statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
    statLabel: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
    recentOrdersContainer: { paddingHorizontal: 16, gap: 10 },
    orderNotification: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 1,
    },
    orderNotifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderNotifId: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    orderNotifDetails: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    emptyText: {
        color: Colors.textMuted,
        textAlign: 'center',
        marginVertical: 16,
    },
});
