import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { useCart } from '../context/CartContext';
import { formatRWF } from '../constants/i18n';

export default function CartItemRow({ item }: any) {
    const { updateQuantity } = useCart();

    return (
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>{formatRWF(item.price)} × {item.quantity}</Text>
            </View>
            <View style={styles.controls}>
                <TouchableOpacity style={styles.btn} onPress={() => updateQuantity(item.product_id, item.quantity - 1)}>
                    <Text style={styles.btnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity style={styles.btn} onPress={() => updateQuantity(item.product_id, item.quantity + 1)}>
                    <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
    name: { fontSize: 16, fontWeight: '600', color: Colors.text },
    price: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
    controls: { flexDirection: 'row', alignItems: 'center' },
    btn: { width: 30, height: 30, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
    btnText: { fontSize: 16, fontWeight: 'bold' },
    qty: { marginHorizontal: 12, fontSize: 16, fontWeight: 'bold' }
});