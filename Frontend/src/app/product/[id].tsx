import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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

    if (loading || !product) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

    const imageUrl = product.images?.[0] || 'https://via.placeholder.com/300';

    return (
        <ScrollView style={styles.container}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
            <View style={styles.content}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.price}>${product.price}</Text>
                <Text style={styles.category}>Category: {product.category}</Text>
                <Text style={styles.stock}>In Stock: {product.quantity}</Text>
                <Button title="Add to Cart" onPress={() => { addToCart(product); Alert.alert('Success', 'Added to cart!'); }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    image: { width: '100%', height: 300, resizeMode: 'cover' },
    content: { padding: 20 },
    name: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
    price: { fontSize: 20, fontWeight: 'bold', color: Colors.primary, marginVertical: 8 },
    category: { fontSize: 16, color: Colors.textMuted, marginBottom: 4 },
    stock: { fontSize: 16, color: Colors.textMuted, marginBottom: 20 }
});