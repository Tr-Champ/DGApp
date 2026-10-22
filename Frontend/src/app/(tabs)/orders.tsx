import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../../services/api';
import { Colors } from '../../constants/Colors';

export default function OrdersScreen() {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/');
            setOrders(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({ item }: any) => (
                    <View style={styles.card}>
                        <Text style={styles.id}>Order ID: {item.id}</Text>
                        <Text style={styles.text}>Total: ${item.total_price}</Text>
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
    container: { flex: 1, padding: 10, backgroundColor: Colors.background },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    id: { fontSize: 14, fontWeight: 'bold', color: Colors.text },
    text: { fontSize: 14, marginTop: 4, color: Colors.textMuted },
    status: { fontSize: 14, fontWeight: 'bold', marginTop: 8 }
});