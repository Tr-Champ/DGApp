import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

interface CategoryStat {
    name: string;
    count: number;
    revenue: number;
}

export default function AdminReports() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        try {
            let fetchedOrders: Order[] = [];
            try {
                const ordersRes = await api.get('/orders/all');
                fetchedOrders = ordersRes.data || [];
            } catch {
                const fallback = await api.get('/orders/');
                fetchedOrders = fallback.data || [];
            }

            let fetchedProducts: any[] = [];
            try {
                const productsRes = await api.get('/products/');
                fetchedProducts = productsRes.data || [];
            } catch (err) {
                console.warn(err);
            }

            setOrders(fetchedOrders);
            setProducts(fetchedProducts);

            // Build category breakdown from products
            const catMap: Record<string, { count: number; revenue: number }> = {};
            fetchedProducts.forEach((p) => {
                const cat = p.category || 'General';
                if (!catMap[cat]) catMap[cat] = { count: 0, revenue: 0 };
                catMap[cat].count += 1;
                catMap[cat].revenue += parseFloat(p.price) || 0;
            });

            const catArray: CategoryStat[] = Object.entries(catMap).map(([name, v]) => ({
                name,
                count: v.count,
                revenue: v.revenue,
            })).sort((a, b) => b.count - a.count);

            setCategoryStats(catArray);
        } catch (e) {
            console.error('Reports fetch error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

    const totalRevenue = orders
        .filter((o) => o.delivered)
        .reduce((s, o) => s + (parseFloat(o.total_price as any) || 0), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => !o.delivered).length;
    const deliveredOrders = orders.filter((o) => o.delivered).length;
    const conversionRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0.0';
    const avgOrderValue = deliveredOrders > 0 ? (totalRevenue / deliveredOrders).toFixed(2) : '0.00';

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
            }
        >
            {/* Revenue banner */}
            <View style={styles.revenueBanner}>
                <Ionicons name="cash-outline" size={36} color="#fff" style={{ marginBottom: 6 }} />
                <Text style={styles.revenueLabel}>Realized Revenue (Delivered Orders)</Text>
                <Text style={styles.revenueValue}>${totalRevenue.toFixed(2)}</Text>
            </View>

            {/* Key metrics */}
            <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
            <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                    <Text style={styles.metricValue}>{totalOrders}</Text>
                    <Text style={styles.metricLabel}>Total Orders</Text>
                </View>
                <View style={styles.metricBox}>
                    <Text style={[styles.metricValue, { color: Colors.secondary }]}>{pendingOrders}</Text>
                    <Text style={styles.metricLabel}>Pending</Text>
                </View>
                <View style={styles.metricBox}>
                    <Text style={[styles.metricValue, { color: Colors.success }]}>{deliveredOrders}</Text>
                    <Text style={styles.metricLabel}>Delivered</Text>
                </View>
            </View>

            <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                    <Text style={styles.metricValue}>{conversionRate}%</Text>
                    <Text style={styles.metricLabel}>Fulfillment</Text>
                </View>
                <View style={styles.metricBox}>
                    <Text style={styles.metricValue}>${avgOrderValue}</Text>
                    <Text style={styles.metricLabel}>Avg Order</Text>
                </View>
                <View style={styles.metricBox}>
                    <Text style={styles.metricValue}>{products.length}</Text>
                    <Text style={styles.metricLabel}>Catalog Items</Text>
                </View>
            </View>

            {/* Category breakdown */}
            <Text style={styles.sectionTitle}>Catalog Inventory by Category</Text>
            <View style={styles.cardContainer}>
                {categoryStats.length === 0 ? (
                    <Text style={styles.noData}>No category data available.</Text>
                ) : (
                    categoryStats.map((cat) => {
                        const maxCount = categoryStats[0]?.count || 1;
                        const barWidth = `${Math.max(10, Math.round((cat.count / maxCount) * 100))}%` as any;
                        return (
                            <View style={styles.catRow} key={cat.name}>
                                <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                                <View style={styles.barBg}>
                                    <View style={[styles.barFill, { width: barWidth }]} />
                                </View>
                                <Text style={styles.catCount}>{cat.count} items</Text>
                            </View>
                        );
                    })
                )}
            </View>

            {/* Customer Transaction Logs */}
            <Text style={styles.sectionTitle}>Customer Transaction Logs</Text>
            <View style={styles.cardContainer}>
                {orders.length === 0 ? (
                    <Text style={styles.noData}>No customer transactions recorded yet.</Text>
                ) : (
                    orders.map((ord) => (
                        <View key={ord.id} style={styles.txRow}>
                            <View style={styles.txLeft}>
                                <Text style={styles.txId}>TX #{ord.id.startsWith('ORD-') ? ord.id.replace('ORD-', '') : ord.id.replace(/-/g, '').slice(0, 5).toUpperCase()}</Text>
                                <Text style={styles.txMeta}>
                                    {Array.isArray(ord.items) ? ord.items.length : 0} items · {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Recent'}
                                </Text>
                            </View>
                            <View style={styles.txRight}>
                                <Text style={styles.txAmount}>${parseFloat(ord.total_price as any || 0).toFixed(2)}</Text>
                                <Text style={[styles.txStatus, { color: ord.delivered ? Colors.success : Colors.secondary }]}>
                                    {ord.delivered ? 'Completed' : 'Pending'}
                                </Text>
                            </View>
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
    revenueBanner: {
        backgroundColor: Colors.primary,
        padding: 24,
        alignItems: 'center',
    },
    revenueLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
    revenueValue: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 4 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMuted,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    metricsRow: { flexDirection: 'row', marginHorizontal: 12, gap: 10, marginBottom: 10 },
    metricBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    metricValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
    metricLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
    cardContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 14,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 1,
    },
    catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    catName: { width: 100, fontSize: 13, color: Colors.text, fontWeight: '600' },
    barBg: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginHorizontal: 8 },
    barFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
    catCount: { width: 55, textAlign: 'right', fontSize: 12, fontWeight: '700', color: Colors.text },
    noData: { textAlign: 'center', color: Colors.textMuted, marginVertical: 12, fontSize: 13 },
    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    txLeft: { flex: 1 },
    txId: { fontSize: 13, fontWeight: '700', color: Colors.text },
    txMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    txRight: { alignItems: 'flex-end' },
    txAmount: { fontSize: 14, fontWeight: '800', color: Colors.primary },
    txStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },
});
