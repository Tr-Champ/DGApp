import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, RefreshControl } from 'react-native';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/Colors';

export default function CustomerHome() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await api.get('/products/');
            setProducts(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const onRefresh = () => { setRefreshing(true); fetchProducts(); };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                renderItem={({ item }) => <ProductCard product={item} />}
                keyExtractor={(item: any) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={products.length > 1 ? styles.row : undefined}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No products available right now.</Text>
                        <Text style={styles.emptySubtext}>Pull down to refresh.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: Colors.background },
    row: { justifyContent: 'space-between' },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
    emptySubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
});
