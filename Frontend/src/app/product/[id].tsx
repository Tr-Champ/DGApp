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
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
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
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProductDetails();
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            const res = await api.get(`/products/${id}`);
            setProduct(res.data);
        } catch (e) {
            console.error(e);
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
            </SafeAreaView>
        );
    }

    const images: string[] =
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : ['https://via.placeholder.com/400'];

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
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: Math.max(30, insets.bottom + 24) }}
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

                    {/* 1/5 Image Counter Badge */}
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
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.price}>{formatRWF(parseFloat(product.price || 0))}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaBadge}>
                            <Text style={styles.metaBadgeText}>{product.category || 'General'}</Text>
                        </View>
                        <Text style={[styles.stockText, (product.quantity ?? 0) <= 0 && { color: Colors.error }]}>
                            {(product.quantity ?? 0) <= 0
                                ? (lang === 'rw' ? 'Nta bihari' : lang === 'fr' ? 'Rupture de stock' : 'Out of Stock')
                                : `#Items: ${product.quantity} (${lang === 'rw' ? 'ibicuruzwa bihari' : lang === 'fr' ? 'exemplaires' : 'copies'})`}
                        </Text>

                    </View>

                    {product.info?.description ? (
                        <View style={styles.descBox}>
                            <Text style={styles.descTitle}>Description</Text>
                            <Text style={styles.descText}>{product.info.description}</Text>
                        </View>
                    ) : null}

                    <Button
                        title={t.addToCart}
                        onPress={() => {
                            if ((product.quantity ?? 0) <= 0) {
                                return Alert.alert(t.outOfStock, lang === 'rw' ? 'Iyi nyongeramazina nta bihari.' : lang === 'fr' ? 'Ce produit est en rupture de stock.' : 'This product is currently out of stock.');
                            }
                            addToCart(product);
                            Alert.alert(t.success, `${product.name} ${lang === 'rw' ? 'yongereye mu igare' : lang === 'fr' ? 'ajouté au panier' : 'added to cart'}!`);
                        }}
                        style={[styles.cartBtn, (product.quantity ?? 0) <= 0 && { backgroundColor: Colors.textMuted }]}
                    />
                </View>
            </ScrollView>
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
        fontWeight: '700',
        color: Colors.text,
        maxWidth: 240,
    },
    scroll: { flex: 1 },
    carouselContainer: {
        position: 'relative',
        width: SCREEN_WIDTH,
        height: 330,
        backgroundColor: '#E5E7EB',
    },
    carouselImage: {
        width: SCREEN_WIDTH,
        height: 330,
    },
    counterBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
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
    },
    dot: {
        height: 7,
        borderRadius: 4,
        marginHorizontal: 3,
    },
    activeDot: {
        width: 18,
        backgroundColor: Colors.primary,
    },
    inactiveDot: {
        width: 7,
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
    },
    content: {
        padding: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    price: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.primary,
        marginVertical: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 16,
    },
    metaBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    metaBadgeText: {
        color: Colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    stockText: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    descBox: {
        marginVertical: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    descTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 6,
    },
    descText: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 22,
    },
    cartBtn: {
        marginTop: 16,
        borderRadius: 12,
        paddingVertical: 14,
    },
});