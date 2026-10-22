import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../services/api';
import { Colors } from '../../constants/Colors';

export default function OrdersScreen() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await api.get('/orders/');
            setOrders(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                keyExtractor={(item: any) => item.id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders placed yet.</Text>
                        <Text style={styles.emptySubtext}>When you place an order, it will appear here.</Text>
                    </View>
                }
                renderItem={({ item }: any) => (
                    <View style={styles.card}>
                        <Text style={styles.id}>Order ID: {item.id}</Text>
                        <Text style={styles.text}>Total: ${typeof item.total_price === 'number' ? item.total_price.toFixed(2) : item.total_price}</Text>
                        {Array.isArray(item.items) && item.items.length > 0 && (
                            <Text style={styles.itemCount}>{item.items.length} {item.items.length === 1 ? 'item' : 'items'}</Text>
                        )}
                        <Text style={[styles.status, { color: item.delivered ? Colors.success : Colors.secondary }]}>
                            Status: {item.delivered ? 'Delivered' : 'Processing'}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, backgroundColor: Colors.background },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    id: { fontSize: 13, fontWeight: 'bold', color: Colors.text },
    text: { fontSize: 15, fontWeight: '600', marginTop: 6, color: Colors.primary },
    itemCount: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
    status: { fontSize: 13, fontWeight: 'bold', marginTop: 8 },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
    emptySubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center' }
});