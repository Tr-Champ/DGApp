import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Input from '../../components/Input';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/Colors';

const CATEGORIES = ['All', 'Clothes', 'Shoes', 'Bags', 'Household', 'Jewelry', 'Cosmetics'];
const PRICE_FILTERS = ['All Prices', 'Under $50', '$50 - $150', 'Over $150'];

export default function CustomerSearch() {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedPriceFilter, setSelectedPriceFilter] = useState('All Prices');
    const [sortAscending, setSortAscending] = useState<boolean | null>(null);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchFilteredProducts();
        }, 400);
        return () => clearTimeout(delayDebounce);
    }, [search]);

    const fetchFilteredProducts = async () => {
        try {
            const res = await api.get(`/products/?search=${encodeURIComponent(search.trim())}`);
            setProducts(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    // Filter by Category and Price
    const filteredProducts = products.filter((p) => {
        const matchesCategory =
            selectedCategory === 'All' ||
            (p.category || '').toLowerCase() === selectedCategory.toLowerCase();

        const price = parseFloat(p.price || 0);
        let matchesPrice = true;
        if (selectedPriceFilter === 'Under $50') {
            matchesPrice = price < 50;
        } else if (selectedPriceFilter === '$50 - $150') {
            matchesPrice = price >= 50 && price <= 150;
        } else if (selectedPriceFilter === 'Over $150') {
            matchesPrice = price > 150;
        }

        return matchesCategory && matchesPrice;
    });

    // Sort by price if toggled
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const priceA = parseFloat(a.price || 0);
        const priceB = parseFloat(b.price || 0);
        if (sortAscending === true) return priceA - priceB;
        if (sortAscending === false) return priceB - priceA;
        return 0;
    });

    return (
        <View style={styles.container}>
            {/* Search Input */}
            <Input
                placeholder="Search products by name..."
                value={search}
                onChangeText={setSearch}
            />

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.filterPill, selectedCategory === cat && styles.filterPillActive]}
                        onPress={() => setSelectedCategory(cat)}
                    >
                        <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Price Filter Pills & Sort Button */}
            <View style={styles.priceRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    {PRICE_FILTERS.map((pRange) => (
                        <TouchableOpacity
                            key={pRange}
                            style={[styles.pricePill, selectedPriceFilter === pRange && styles.pricePillActive]}
                            onPress={() => setSelectedPriceFilter(pRange)}
                        >
                            <Text style={[styles.priceText, selectedPriceFilter === pRange && styles.priceTextActive]}>
                                {pRange}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={[styles.sortBtn, sortAscending !== null && styles.sortBtnActive]}
                    onPress={() => {
                        if (sortAscending === null) setSortAscending(true);
                        else if (sortAscending === true) setSortAscending(false);
                        else setSortAscending(null);
                    }}
                >
                    <Ionicons
                        name={sortAscending === true ? 'arrow-up' : sortAscending === false ? 'arrow-down' : 'swap-vertical'}
                        size={14}
                        color={sortAscending !== null ? '#FFFFFF' : Colors.text}
                    />
                    <Text style={[styles.sortBtnText, sortAscending !== null && { color: '#FFFFFF' }]}>
                        {sortAscending === true ? 'Price: Low' : sortAscending === false ? 'Price: High' : 'Sort'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Products List */}
            <FlatList
                data={sortedProducts}
                renderItem={({ item }) => <ProductCard product={item} />}
                keyExtractor={(item: any) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={sortedProducts.length > 1 ? styles.row : undefined}
                contentContainerStyle={{ paddingBottom: 24 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search" size={42} color={Colors.border} style={{ marginBottom: 10 }} />
                        <Text style={styles.emptyText}>No matching products found.</Text>
                        <Text style={styles.emptySubtext}>Try adjusting your search terms or filters.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, backgroundColor: Colors.background },
    filtersScroll: { marginVertical: 4 },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
    filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
    pricePill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        marginRight: 6,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    pricePillActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
    priceText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
    priceTextActive: { color: '#FFFFFF', fontWeight: '700' },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sortBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    sortBtnText: { fontSize: 11, fontWeight: '700', color: Colors.text, marginLeft: 4 },
    row: { justifyContent: 'space-between' },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
    emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
});
