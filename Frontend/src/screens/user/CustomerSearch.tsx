import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Input from '../../components/Input';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';

const CATEGORIES = ['All', 'Clothes', 'Shoes', 'Bags', 'Household', 'Jewelry', 'Cosmetics'];
// RWF-based price tiers: < 50,000 / 50,000-150,000 / > 150,000
const PRICE_FILTERS = ['All Prices', 'Under 50k RWF', '50k-150k RWF', 'Over 150k RWF'];

// In-memory cache for instant zero-spinner loading on tab navigation
let cachedSearchProducts: any[] = [];

export default function CustomerSearch() {
    const { t, lang } = useLanguage();
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<any[]>(cachedSearchProducts);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedPriceFilter, setSelectedPriceFilter] = useState('All Prices');
    const [sortAscending, setSortAscending] = useState<boolean | null>(null);

    useEffect(() => {
        if (cachedSearchProducts.length === 0) {
            fetchFilteredProducts();
        }
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchFilteredProducts();
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [search]);

    const fetchFilteredProducts = async () => {
        try {
            const url = search.trim() ? `/products/?search=${encodeURIComponent(search.trim())}` : '/products/';
            const res = await api.get(url);
            const data = res.data || [];
            if (!search.trim()) cachedSearchProducts = data;
            setProducts(data);
        } catch (e) {
            console.error(e);
        }
    };


    // Filter by Category and Price (RWF tiers)
    const filteredProducts = products.filter((p) => {
        const matchesCategory =
            selectedCategory === 'All' ||
            (p.category || '').toLowerCase() === selectedCategory.toLowerCase();

        const price = parseFloat(p.price || 0);
        let matchesPrice = true;
        if (selectedPriceFilter === 'Under 50k RWF') {
            matchesPrice = price < 50000;
        } else if (selectedPriceFilter === '50k-150k RWF') {
            matchesPrice = price >= 50000 && price <= 150000;
        } else if (selectedPriceFilter === 'Over 150k RWF') {
            matchesPrice = price > 150000;
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
                placeholder={lang === 'rw' ? 'Shakisha ibicuruzwa ku izina...' : lang === 'fr' ? 'Rechercher par nom de produit...' : 'Search products by name...'}
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
                        {sortAscending === true
                            ? (lang === 'rw' ? 'Igiciro: Hasi' : lang === 'fr' ? 'Prix: Bas' : 'Price: Low')
                            : sortAscending === false
                            ? (lang === 'rw' ? 'Igiciro: Hejuru' : lang === 'fr' ? 'Prix: Haut' : 'Price: High')
                            : (lang === 'rw' ? 'Tondeka' : lang === 'fr' ? 'Trier' : 'Sort')}
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
                        <Text style={styles.emptyText}>
                            {lang === 'rw' ? 'Nta bicuruzwa bihuye byabonetse.' : lang === 'fr' ? 'Aucun produit correspondant trouvé.' : 'No matching products found.'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {lang === 'rw' ? 'Gerageza guhindura ijambo ryo gushakisha cyangwa akayunguruzo.' : lang === 'fr' ? 'Essayez de modifier vos termes de recherche ou vos filtres.' : 'Try adjusting your search terms or filters.'}
                        </Text>
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
