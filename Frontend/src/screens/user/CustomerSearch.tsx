import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import api from '../../services/api';
import Input from '../../components/Input';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/Colors';

export default function CustomerSearch() {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchFilteredProducts();
        }, 400);
        return () => clearTimeout(delayDebounce);
    }, [search]);

    const fetchFilteredProducts = async () => {
        try {
            const res = await api.get(`/products/?search=${search}`);
            setProducts(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <Input placeholder="Search products by name..." value={search} onChangeText={setSearch} />
            <FlatList
                data={products}
                renderItem={({ item }) => <ProductCard product={item} />}
                keyExtractor={(item: any) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={styles.row}
                style={{ marginTop: 10 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: Colors.background },
    row: { justifyContent: 'space-between' },
});
