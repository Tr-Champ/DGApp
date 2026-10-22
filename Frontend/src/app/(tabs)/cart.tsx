import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import CartItemRow from '../../components/CartItemRow';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';

export default function CartScreen() {
    const { cartItems, totalPrice } = useCart();
    const router = useRouter();

    return (
        <View style={styles.container}>
            {cartItems.length === 0 ? (
                <Text style={styles.empty}>Your cart is empty.</Text>
            ) : (
                <>
                    <FlatList data={cartItems} renderItem={({ item }) => <CartItemRow item={item} />} keyExtractor={(item) => item.product_id.toString()} />
                    <View style={styles.footer}>
                        <Text style={styles.total}>Total: ${totalPrice.toFixed(2)}</Text>
                        <Button title="Proceed to Checkout" onPress={() => router.push('/checkout')} />
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: Colors.background },
    empty: { textAlign: 'center', marginTop: 50, fontSize: 16, color: Colors.textMuted },
    footer: { padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: Colors.border },
    total: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: Colors.text }
});