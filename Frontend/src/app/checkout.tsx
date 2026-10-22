import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function CheckoutScreen() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;
        try {
            setLoading(true);
            const orderId = uuidv4();
            await api.post('/orders/', {
                id: orderId,
                items: cartItems,
                total_price: totalPrice
            });
            await clearCart();
            Alert.alert('Success', 'Order placed successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/orders') }
            ]);
        } catch (e: any) {
            Alert.alert('Checkout Failed', e.response?.data?.detail || 'Could not complete order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Order Summary</Text>
            <Text style={styles.total}>Total Amount: ${totalPrice.toFixed(2)}</Text>
            <Button title="Confirm & Pay" onPress={handleCheckout} loading={loading} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: Colors.background },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: Colors.text },
    total: { fontSize: 20, textAlign: 'center', marginBottom: 30, color: Colors.primary, fontWeight: 'bold' }
});