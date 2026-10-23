import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { formatRWF } from '../constants/i18n';

export default function ProductCard({ product }: { product: any }) {
    const router = useRouter();

    const images: string[] = Array.isArray(product?.images) && product.images.length > 0
        ? product.images
        : ['https://via.placeholder.com/150'];
    const imageUrl = images[0];
    const imageCount = images.length;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/product/${product.id}`)}
            activeOpacity={0.8}
        >
            <View style={styles.imageWrapper}>
                <Image source={{ uri: imageUrl }} style={styles.image} />
                {imageCount > 1 && (
                    <View style={styles.imageBadge}>
                        <Ionicons name="images-outline" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                        <Text style={styles.imageBadgeText}>{imageCount}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.name} numberOfLines={1}>
                {product?.name || 'Product'}
            </Text>
            <Text style={styles.price}>{formatRWF(parseFloat(product?.price || 0))}</Text>
            {/* Show quantity badge only when low stock */}
            {typeof product?.quantity === 'number' && product.quantity <= 5 && product.quantity > 0 && (
                <Text style={styles.lowStock}>Only {product.quantity} left!</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '48%',
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        height: 125,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    imageBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 8,
    },
    price: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.primary,
        marginTop: 4,
    },
    lowStock: {
        fontSize: 11,
        color: Colors.error,
        fontWeight: '700',
        marginTop: 2,
    },
});