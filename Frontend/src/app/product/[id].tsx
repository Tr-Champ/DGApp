import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Platform,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { formatRWF } from '../../constants/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t, lang } = useLanguage();
    const { user } = useAuth();
    const { cartCount, addToCart } = useCart();
    const isAdmin = user?.role === 'admin' || user?.is_admin === true;

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [justAdded, setJustAdded] = useState(false);

    useEffect(() => {
        if (id) fetchProductDetails();
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/products/${id}`);
            setProduct(res.data);
        } catch (e) {
            console.warn('Failed to fetch product details', e);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        if (index !== activeImageIndex && index >= 0) {
            setActiveImageIndex(index);
        }
    };

    if (loading || !product) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.loadingText}>Loading product details...</Text>
            </SafeAreaView>
        );
    }

    const rawImages: string[] = Array.isArray(product?.images) ? product.images : [];
    const validImages = rawImages.filter((img: any) => typeof img === 'string' && img.startsWith('http'));
    const images: string[] = validImages.length > 0
        ? validImages
        : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'];

    const isOutOfStock = (product.quantity ?? 0) <= 0;

    const handleAddToCart = () => {
        if (isOutOfStock) {
            return Alert.alert(
                t.outOfStock,
                lang === 'rw' ? 'Iki gicuruzwa nta bihari ubu.' : lang === 'fr' ? 'Ce produit est en rupture de stock.' : 'This product is currently out of stock.'
            );
        }
        addToCart(product);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
    };

    const isAndroid = Platform.OS === 'android';
    const bottomPadding = insets.bottom > 0 ? insets.bottom : (isAndroid ? 10 : 6);
    const tabHeight = 54 + bottomPadding;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Top Navigation Bar with Back Button */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.topBarTitle} numberOfLines={1}>
                    {product.name}
                </Text>
                <TouchableOpacity
                    style={styles.cartShortcut}
                    onPress={() => router.push('/(tabs)/tab3')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="cart-outline" size={24} color={Colors.text} />
                    {cartCount > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Horizontal Swipeable Image Gallery */}
                <View style={styles.carouselContainer}>
                    <FlatList
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, index) => index.toString()}
                        onMomentumScrollEnd={handleScroll}
                        renderItem={({ item }) => (
                            <Image
                                source={{ uri: item }}
                                style={styles.carouselImage}
                                resizeMode="cover"
                            />
                        )}
                    />

                    {/* Image Counter Badge */}
                    <View style={styles.counterBadge}>
                        <Ionicons name="images-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.counterBadgeText}>
                            {activeImageIndex + 1}/{images.length}
                        </Text>
                    </View>

                    {/* Pagination Dots */}
                    {images.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {images.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        i === activeImageIndex ? styles.activeDot : styles.inactiveDot,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Product Content Details */}
                <View style={styles.content}>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{formatRWF(parseFloat(product.price || 0))}</Text>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{product.category || 'General'}</Text>
                        </View>
                    </View>

                    <Text style={styles.name}>{product.name}</Text>

                    <View style={styles.stockRow}>
                        <Ionicons
                            name={isOutOfStock ? 'close-circle' : 'checkmark-circle'}
                            size={16}
                            color={isOutOfStock ? Colors.error : Colors.success}
                        />
                        <Text style={[styles.stockText, isOutOfStock && { color: Colors.error }]}>
                            {isOutOfStock
                                ? (lang === 'rw' ? 'Nta bihari' : lang === 'fr' ? 'Rupture de stock' : 'Out of Stock')
                                : `${product.quantity} in stock (${lang === 'rw' ? 'ibicuruzwa bihari' : lang === 'fr' ? 'unités disponibles' : 'available units'})`}
                        </Text>
                    </View>

                    {product.info?.description ? (
                        <View style={styles.descBox}>
                            <Text style={styles.descTitle}>Description</Text>
                            <Text style={styles.descText}>{product.info.description}</Text>
                        </View>
                    ) : null}

                    {/* Fast delivery notice */}
                    <View style={styles.deliveryCard}>
                        <Ionicons name="flash-outline" size={20} color={Colors.primary} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.deliveryTitle}>Express Local Delivery</Text>
                            <Text style={styles.deliverySub}>Real-time delivery confirmation right on your phone.</Text>
                        </View>
                    </View>

                    {/* Add to Cart Button */}
                    <Button
                        title={
                            justAdded
                                ? (lang === 'rw' ? '✓ Byongerewe mu Gare!' : lang === 'fr' ? '✓ Ajouté au Panier!' : '✓ Added to Cart!')
                                : t.addToCart
                        }
                        onPress={handleAddToCart}
                        style={[
                            styles.cartBtn,
                            isOutOfStock && { backgroundColor: Colors.textMuted },
                            justAdded && { backgroundColor: Colors.success },
                        ]}
                    />
                </View>
            </ScrollView>

            {/* Bottom Tabs Bar: Kept permanently visible while browsing products */}
            <View style={[styles.bottomTabBar, { height: tabHeight, paddingBottom: bottomPadding }]}>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.replace('/(tabs)/tab1')}
                    activeOpacity={0.7}
                >
                    <Ionicons name={isAdmin ? 'grid-outline' : 'home-outline'} size={22} color={Colors.textMuted} />
                    <Text style={styles.tabLabel}>{isAdmin ? 'Dashboard' : 'Home'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.replace('/(tabs)/tab2')}
                    activeOpacity={0.7}
                >
                    <Ionicons name={isAdmin ? 'cube-outline' : 'search-outline'} size={22} color={Colors.textMuted} />
                    <Text style={styles.tabLabel}>{isAdmin ? 'Products' : 'Search'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.replace('/(tabs)/tab3')}
                    activeOpacity={0.7}
                >
                    <View style={styles.tabIconWrapper}>
                        <Ionicons name={isAdmin ? 'checkmark-done-circle-outline' : 'cart-outline'} size={24} color={Colors.primary} />
                        {!isAdmin && cartCount > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{cartCount}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.tabLabel, { color: Colors.primary, fontWeight: '700' }]}>
                        {isAdmin ? 'Deliveries' : 'Cart'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.replace('/(tabs)/tab4')}
                    activeOpacity={0.7}
                >
                    <Ionicons name={isAdmin ? 'bar-chart-outline' : 'list-outline'} size={22} color={Colors.textMuted} />
                    <Text style={styles.tabLabel}>{isAdmin ? 'Reports' : 'Orders'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => router.replace('/(tabs)/profile')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="person-outline" size={22} color={Colors.textMuted} />
                    <Text style={styles.tabLabel}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 4,
    },
    topBarTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        maxWidth: 220,
    },
    cartShortcut: {
        padding: 4,
        position: 'relative',
    },
    headerBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    headerBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    scroll: { flex: 1 },
    carouselContainer: {
        position: 'relative',
        width: SCREEN_WIDTH,
        height: 320,
        backgroundColor: '#F1F5F9',
    },
    carouselImage: {
        width: SCREEN_WIDTH,
        height: 320,
    },
    counterBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
    },
    counterBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    activeDot: {
        width: 20,
        backgroundColor: Colors.primary,
    },
    inactiveDot: {
        width: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
    },
    content: {
        padding: 18,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    price: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.primary,
    },
    categoryBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
    },
    categoryBadgeText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    name: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 10,
        lineHeight: 26,
    },
    stockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    stockText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.success,
    },
    descBox: {
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    descTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 6,
    },
    descText: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 20,
    },
    deliveryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    deliveryTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    deliverySub: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    cartBtn: {
        marginTop: 4,
        borderRadius: 14,
        paddingVertical: 14,
    },
    bottomTabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 6,
        elevation: 10,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconWrapper: {
        position: 'relative',
    },
    tabBadge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    tabBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textMuted,
        marginTop: 2,
    },
});
