import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { formatRWF } from '../../constants/i18n';

const CATEGORIES = ['All', 'Clothes', 'Shoes', 'Bags', 'Household', 'Jewelry', 'Cosmetics'];
const POLL_INTERVAL_MS = 5000; // 5-second real-time sync for blink updates

// In-memory cache for instant zero-spinner loading on tab navigation
let cachedProducts: any[] = [];
let cachedPendingOrders: any[] = [];

export default function CustomerHome() {
    const router = useRouter();
    const { token } = useAuth();
    const { t, lang } = useLanguage();
    const [products, setProducts] = useState<any[]>(cachedProducts);
    const [pendingOrders, setPendingOrders] = useState<any[]>(cachedPendingOrders);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(cachedProducts.length === 0);
    const [refreshing, setRefreshing] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const formatOrderRef = (id: string) => {
        if (!id) return '#ORD-001';
        if (id.startsWith('ORD-')) return `#${id}`;
        if (!isNaN(Number(id))) return `#ORD-${id}`;
        return `#ORD-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
    };

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent && cachedProducts.length === 0) setLoading(true);
            const productsPromise = api.get('/products/');
            const ordersPromise = token
                ? api.get('/orders/').catch(() => ({ data: [] }))
                : Promise.resolve({ data: [] });

            const [productsRes, ordersRes] = await Promise.all([productsPromise, ordersPromise]);

            const newProducts = productsRes.data || [];
            cachedProducts = newProducts;
            setProducts(newProducts);

            const allOrders: any[] = ordersRes.data || [];
            // Only show banner for orders that are NOT yet delivered
            const pending = allOrders.filter((o) => !o.delivered);
            cachedPendingOrders = pending;
            setPendingOrders(pending);
        } catch {
            // Silently fallback without crashing
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        // Fetch silently if we already have cached data to show immediately
        fetchData(cachedProducts.length > 0);

        // Real-time sync: poll only when user is logged in
        if (token) {
            pollRef.current = setInterval(() => {
                fetchData(true);
            }, POLL_INTERVAL_MS);
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchData, token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    const handleConfirmDeliveryFromBanner = (order: any) => {
        const orderRef = formatOrderRef(order.id);
        Alert.alert(
            t.confirmDelivery,
            lang === 'rw'
                ? `Wabonye ibicuruzwa bya ${orderRef}? Emeza uzarangize igabana ry'itangwa.`
                : lang === 'fr'
                ? `Avez-vous reçu votre colis pour ${orderRef}? Confirmer complète le processus de livraison.`
                : `Have you received your package for ${orderRef}?\nConfirming marks the delivery handshake as complete.`,
            [
                { text: lang === 'rw' ? 'Reba Amateka' : lang === 'fr' ? 'Voir les commandes' : 'View All Orders', onPress: () => router.push('/(tabs)/tab4') },
                {
                    text: lang === 'rw' ? 'Yego, Byatanzwe!' : lang === 'fr' ? 'Oui, Reçu!' : 'Yes, Delivered!',
                    onPress: async () => {
                        // Immediately dismiss banner in the blink of an eye
                        setPendingOrders((prev) => prev.filter((o) => o.id !== order.id));
                        cachedPendingOrders = cachedPendingOrders.filter((o) => o.id !== order.id);

                        try {
                            await api.patch(`/orders/${order.id}/deliver`);
                            Alert.alert(t.success, `${lang === 'rw' ? 'Itangwa rya' : lang === 'fr' ? 'Commande' : 'Order'} ${orderRef} ${lang === 'rw' ? 'ryemejwe!' : lang === 'fr' ? 'confirmée!' : 'confirmed!'}`);
                            fetchData(true);
                        } catch {
                            // If failed, restore orders
                            fetchData(true);
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
                        <Text style={styles.bannerTitle}>
                            {lang === 'rw' ? 'Ibicuruzwa biri mu nzira 🚚' : lang === 'fr' ? 'Livraison en cours 🚚' : 'Delivery In Transit 🚚'}
                        </Text>
                        <Text style={styles.bannerSub} numberOfLines={1}>
                            {lang === 'rw'
                                ? `Iyangu ${formatOrderRef(pendingOrders[0].id)} iri mu nzira! Kanda kugira ngo wemeze.`
                                : lang === 'fr'
                                ? `Commande ${formatOrderRef(pendingOrders[0].id)} arrive! Appuyez pour confirmer.`
                                : `Order ${formatOrderRef(pendingOrders[0].id)} is arriving! Tap to confirm receipt.`}
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
                        <Text style={styles.emptyText}>
                            {lang === 'rw' ? `Nta bicuruzwa muri "${selectedCategory}".` : lang === 'fr' ? `Aucun produit dans "${selectedCategory}".` : `No products found in "${selectedCategory}".`}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {lang === 'rw' ? 'Hitamo icyiciro cindi cyangwa gukurura hasi.' : lang === 'fr' ? 'Choisissez une autre catégorie ou faites glisser vers le bas.' : 'Select another category or pull down to refresh.'}
                        </Text>
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
