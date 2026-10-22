import React from 'react';
import { Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function ProductCard({ product }: { product: any }) {
    const router = useRouter();

    const imageUrl =
        Array.isArray(product?.images) && product.images.length > 0
            ? product.images[0]
            : 'https://via.placeholder.com/150';

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/product/${product.id}`)}
        >
            <Image source={{ uri: imageUrl }} style={styles.image} />
            <Text style={styles.name} numberOfLines={1}>
                {product?.name || 'Product'}
            </Text>
            <Text style={styles.price}>${product?.price ?? '0.00'}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '48%',
        backgroundColor: Colors.card,
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    image: {
        width: '100%',
        height: 120,
        borderRadius: 6,
        resizeMode: 'cover',
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 8,
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
        marginTop: 4,
    },
});