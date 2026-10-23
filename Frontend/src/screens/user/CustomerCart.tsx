import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import CartItemRow from '../../components/CartItemRow';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';

export default function CustomerCart() {
    const { cartItems, totalPrice } = useCart();
    const router = useRouter();

    return (
        <View style={styles.container}>
            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Explore our catalog and find items you love.</Text>
                    <Button title="Explore Products" onPress={() => router.push('/(tabs)/tab1')} style={{ marginTop: 20, width: 200 }} />
                </View>
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        renderItem={({ item }) => <CartItemRow item={item} />}
                        keyExtractor={(item) => item.product_id.toString()}
                    />
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
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
    footer: { padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: Colors.border },
    total: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: Colors.text },
});
