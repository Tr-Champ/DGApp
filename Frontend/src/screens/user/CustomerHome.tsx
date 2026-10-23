import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Text,
    RefreshControl,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/Colors';

const CATEGORIES = ['All', 'Clothes', 'Shoes', 'Bags', 'Household', 'Jewelry', 'Cosmetics'];

export default function CustomerHome() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const formatOrderRef = (id: string) => {
        if (!id) return '#ORD-001';
        if (id.startsWith('ORD-')) return `#${id}`;
        if (!isNaN(Number(id))) return `#ORD-${id}`;
        return `#ORD-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
    };

    const fetchData = useCallback(async () => {
        try {
            const [productsRes, ordersRes] = await Promise.all([
                api.get('/products/'),
                api.get('/orders/').catch(() => ({ data: [] })),
            ]);

            setProducts(productsRes.data || []);

            const allOrders: any[] = ordersRes.data || [];
            const pending = allOrders.filter((o) => !o.delivered);
            setPendingOrders(pending);
        } catch (e) {
            console.error('Home data fetch error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleConfirmDeliveryFromBanner = (order: any) => {
        const orderRef = formatOrderRef(order.id);
        Alert.alert(
            'Confirm Delivery Receipt',
            `Have you received your package for ${orderRef}?\nConfirming marks the delivery handshake as complete.`,
            [
                { text: 'View All Orders', onPress: () => router.push('/(tabs)/tab4') },
                {
                    text: 'Yes, Delivered!',
                    onPress: async () => {
                        try {
                            await api.patch(`/orders/${order.id}/deliver`);
                            Alert.alert('Success', `Order ${orderRef} confirmed delivered!`);
                            fetchData();
                        } catch {
                            router.push('/(tabs)/tab4');
                        }
                    },
                },
            ]
        );
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

    const filteredProducts =
        selectedCategory === 'All'
            ? products
            : products.filter(
                  (p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase()
              );

    return (
        <View style={styles.container}>
            {/* IN-APP DELIVERY HANDSHAKE NOTIFICATION BANNER */}
            {pendingOrders.length > 0 && (
                <TouchableOpacity
                    style={styles.notificationBanner}
                    onPress={() => handleConfirmDeliveryFromBanner(pendingOrders[0])}
                    activeOpacity={0.85}
                >
                    <View style={styles.bannerIconBox}>
                        <Ionicons name="notifications" size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bannerTitle}>Delivery In Transit 🚚</Text>
                        <Text style={styles.bannerSub} numberOfLines={1}>
                            Order {formatOrderRef(pendingOrders[0].id)} is arriving! Tap to confirm receipt.
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
                </TouchableOpacity>
            )}

            {/* CATEGORY FILTER PILLS */}
            <View style={styles.categoryContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryPill,
                                selectedCategory === cat && styles.categoryPillActive,
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    selectedCategory === cat && styles.categoryTextActive,
                                ]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* PRODUCT GRID */}
            <FlatList
                data={filteredProducts}
                renderItem={({ item }) => <ProductCard product={item} />}
                keyExtractor={(item: any) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={filteredProducts.length > 1 ? styles.row : undefined}
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="basket-outline" size={48} color={Colors.border} style={{ marginBottom: 10 }} />
                        <Text style={styles.emptyText}>No products found in "{selectedCategory}".</Text>
                        <Text style={styles.emptySubtext}>Select another category or pull down to refresh.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 12, backgroundColor: Colors.background },
    notificationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderWidth: 1.5,
        borderColor: '#A7F3D0',
        borderRadius: 14,
        padding: 12,
        marginTop: 10,
        marginBottom: 8,
        elevation: 2,
    },
    bannerIconBox: {
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    bannerTitle: { fontSize: 13, fontWeight: '800', color: '#065F46' },
    bannerSub: { fontSize: 12, color: '#047857', marginTop: 1 },
    categoryContainer: { marginVertical: 8 },
    categoryScroll: { paddingVertical: 4 },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    categoryPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    categoryTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    row: { justifyContent: 'space-between' },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
    emptySubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
});
