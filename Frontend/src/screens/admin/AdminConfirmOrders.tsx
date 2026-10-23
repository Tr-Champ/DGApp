import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert, Modal, ScrollView, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { Colors } from '../../constants/Colors';

interface CustomerInfo {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    district?: string;
    address?: string;
    payment_method?: string;
    order_ref?: string;
}

interface Order {
    id: string;
    total_price: number;
    delivered: boolean;
    items: any[];
    user_id?: string;
    user_email?: string;
    created_at?: string;
}

type FilterTab = 'all' | 'pending' | 'delivered';

export default function AdminConfirmOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Customer details modal state
    const [selectedCustomerOrder, setSelectedCustomerOrder] = useState<Order | null>(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            let data: Order[] = [];
            try {
                const res = await api.get('/orders/all');
                data = res.data || [];
            } catch {
                const fallback = await api.get('/orders/');
                data = fallback.data || [];
            }
            setOrders(data);
        } catch (e) {
            console.error('Error fetching admin orders', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    // Format a friendly short reference (avoid scary 36-char raw UUID strings)
    const formatOrderRef = (id: string) => {
        if (!id) return '#ORD-001';
        if (id.startsWith('ORD-')) return `#${id}`;
        if (!isNaN(Number(id))) return `#ORD-${id}`;
        return `#ORD-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
    };

    // Extract customer information stored in order items
    const extractCustomerDetails = (order: Order): CustomerInfo => {
        if (Array.isArray(order.items)) {
            const metaItem = order.items.find((it) => it && (it.is_customer_info || it.__customer__));
            if (metaItem?.customer) return metaItem.customer;
        }
        return {
            name: 'Customer Account',
            email: order.user_email || `user-${order.user_id || 'client'}@dgretail.com`,
            phone: 'Contact via App',
            whatsapp: 'Contact via App',
            district: 'Kigali - Standard Delivery',
            payment_method: 'Approved Transaction',
        };
    };

    // Filter out meta objects to get purely ordered product items
    const getProductItems = (order: Order) => {
        if (!Array.isArray(order.items)) return [];
        return order.items.filter((it) => it && !it.is_customer_info && !it.__customer__);
    };

    const handleConfirm = async (order: Order) => {
        const cust = extractCustomerDetails(order);
        Alert.alert(
            'Confirm Delivery Handshake',
            `Mark order ${formatOrderRef(order.id)} for ${cust.name || 'customer'} (${cust.email || 'account'}) as delivered?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Delivered',
                    onPress: async () => {
                        try {
                            setConfirmingId(order.id);
                            await api.patch(`/orders/${order.id}/deliver`);
                            Alert.alert('Delivery Confirmed', `Order ${formatOrderRef(order.id)} successfully delivered!`);
                            fetchOrders();
                        } catch (e: any) {
                            Alert.alert('Error', e.response?.data?.detail || 'Failed to update delivery status.');
                        } finally {
                            setConfirmingId(null);
                        }
                    },
                },
            ]
        );
    };

    const openCustomerDetails = (order: Order) => {
        setSelectedCustomerOrder(order);
        setDetailsModalVisible(true);
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

    const pendingOrders = orders.filter((o) => !o.delivered);
    const deliveredOrders = orders.filter((o) => o.delivered);

    // Filter by Tab and Search Query (search by customer email, name, phone, or order ID)
    const baseList =
        activeFilter === 'pending'
            ? pendingOrders
            : activeFilter === 'delivered'
            ? deliveredOrders
            : orders;

    const filteredOrders = baseList.filter((ord) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const cust = extractCustomerDetails(ord);
        const orderIdStr = formatOrderRef(ord.id).toLowerCase();
        const emailStr = (cust.email || '').toLowerCase();
        const nameStr = (cust.name || '').toLowerCase();
        const phoneStr = (cust.phone || '').toLowerCase();
        const distStr = (cust.district || '').toLowerCase();

        return (
            orderIdStr.includes(q) ||
            emailStr.includes(q) ||
            nameStr.includes(q) ||
            phoneStr.includes(q) ||
            distStr.includes(q)
        );
    });

    const activeCust = selectedCustomerOrder ? extractCustomerDetails(selectedCustomerOrder) : null;
    const activeProducts = selectedCustomerOrder ? getProductItems(selectedCustomerOrder) : [];

    return (
        <View style={styles.container}>
            {/* Search Input Bar for Admin to ask/search customer email */}
            <View style={styles.searchBarContainer}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by customer email, name, phone..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Segmented Filter Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabButton, activeFilter === 'all' && styles.activeTabButton]}
                    onPress={() => setActiveFilter('all')}
                >
                    <Text style={[styles.tabText, activeFilter === 'all' && styles.activeTabText]}>
                        All ({orders.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeFilter === 'pending' && styles.activeTabButton]}
                    onPress={() => setActiveFilter('pending')}
                >
                    <Text style={[styles.tabText, activeFilter === 'pending' && styles.activeTabText]}>
                        Pending ({pendingOrders.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeFilter === 'delivered' && styles.activeTabButton]}
                    onPress={() => setActiveFilter('delivered')}
                >
                    <Text style={[styles.tabText, activeFilter === 'delivered' && styles.activeTabText]}>
                        Delivered ({deliveredOrders.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Orders List */}
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                }
                contentContainerStyle={{ paddingBottom: 30 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={44} color={Colors.border} style={{ marginBottom: 10 }} />
                        <Text style={styles.emptyTitle}>No Orders Found</Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery ? 'No orders match your search criteria.' : 'No orders in this category.'}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const priceNum = parseFloat(item.total_price as any || 0);
                    const isConfirming = confirmingId === item.id;
                    const cust = extractCustomerDetails(item);
                    const productsList = getProductItems(item);

                    return (
                        <View style={[styles.card, item.delivered && styles.deliveredCard]}>
                            {/* Card Header */}
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.orderId}>{formatOrderRef(item.id)}</Text>
                                    <Text style={styles.customerSummary} numberOfLines={1}>
                                        👤 {cust.name || 'Customer'} · {cust.district || 'Kigali'}
                                    </Text>
                                </View>

                                {/* Small Email / Customer Details Icon Button */}
                                <TouchableOpacity
                                    style={styles.customerIconBtn}
                                    onPress={() => openCustomerDetails(item)}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="mail-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.customerIconBtnText}>Email & Info</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.divider} />

                            {/* Details Row */}
                            <View style={styles.detailsRow}>
                                <Text style={styles.itemCount}>
                                    📦 {productsList.length} product{productsList.length !== 1 ? 's' : ''}
                                </Text>
                                <Text style={styles.priceText}>${priceNum.toFixed(2)}</Text>
                            </View>

                            {/* Customer Email preview */}
                            <View style={styles.emailPill}>
                                <Ionicons name="at-outline" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                                <Text style={styles.emailPillText} numberOfLines={1}>{cust.email}</Text>
                            </View>

                            {/* Products preview */}
                            {productsList.length > 0 && (
                                <View style={styles.productsBox}>
                                    {productsList.map((prod: any, idx: number) => (
                                        <Text key={idx} style={styles.productLine} numberOfLines={1}>
                                            • {prod.name || 'Item'} × {prod.quantity || 1} (${parseFloat(prod.price || 0).toFixed(2)})
                                        </Text>
                                    ))}
                                </View>
                            )}

                            {/* Bottom Status / Action */}
                            <View style={styles.cardFooter}>
                                <View style={[styles.statusBadge, { backgroundColor: item.delivered ? Colors.success : Colors.secondary }]}>
                                    <Text style={styles.statusBadgeText}>
                                        {item.delivered ? '✓ Delivered' : '⏳ Pending Delivery'}
                                    </Text>
                                </View>

                                {!item.delivered && (
                                    <TouchableOpacity
                                        style={[styles.confirmBtn, isConfirming && styles.btnDisabled]}
                                        onPress={() => handleConfirm(item)}
                                        disabled={isConfirming}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.confirmBtnText}>
                                            {isConfirming ? 'Updating...' : 'Confirm Delivery'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                }}
            />

            {/* CUSTOMER FULL DETAILS MODAL (EMAIL & ADDRESS INSPECTION) */}
            <Modal
                visible={detailsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <SafeAreaView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>👤 Customer Details</Text>
                                <Text style={styles.modalSub}>
                                    {selectedCustomerOrder ? formatOrderRef(selectedCustomerOrder.id) : ''}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setDetailsModalVisible(false)}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ paddingVertical: 10 }}>
                            {activeCust && (
                                <>
                                    {/* Verified Email Banner */}
                                    <View style={styles.infoSection}>
                                        <Text style={styles.infoLabel}>CUSTOMER EMAIL</Text>
                                        <View style={styles.emailHighlightBox}>
                                            <Ionicons name="mail" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                                            <Text style={styles.emailHighlightText} selectable={true}>
                                                {activeCust.email}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Names & Contact */}
                                    <View style={styles.infoSection}>
                                        <Text style={styles.infoLabel}>FULL NAME</Text>
                                        <Text style={styles.infoValue}>{activeCust.name}</Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={styles.infoLabel}>PHONE (CALLS)</Text>
                                            <Text style={styles.infoValue}>{activeCust.phone}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.infoLabel}>WHATSAPP</Text>
                                            <Text style={styles.infoValue}>{activeCust.whatsapp}</Text>
                                        </View>
                                    </View>

                                    {/* Location & Payment */}
                                    <View style={styles.infoRow}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={styles.infoLabel}>DISTRICT</Text>
                                            <Text style={styles.infoValue}>{activeCust.district}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.infoLabel}>PAYMENT METHOD</Text>
                                            <Text style={[styles.infoValue, { color: Colors.primary }]}>
                                                {activeCust.payment_method?.replace('_', ' ') || 'Paid'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.infoSection}>
                                        <Text style={styles.infoLabel}>DELIVERY ADDRESS / LANDMARK</Text>
                                        <Text style={styles.infoValue}>{activeCust.address || 'Standard Delivery'}</Text>
                                    </View>

                                    {/* Ordered Products */}
                                    <View style={styles.infoSection}>
                                        <Text style={styles.infoLabel}>ORDERED PRODUCTS ({activeProducts.length})</Text>
                                        {activeProducts.map((p: any, i: number) => (
                                            <View key={i} style={styles.modalProdRow}>
                                                <Text style={styles.modalProdName}>{p.name || 'Product'} × {p.quantity || 1}</Text>
                                                <Text style={styles.modalProdPrice}>${parseFloat(p.subtotal || p.price || 0).toFixed(2)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        {/* Modal Action Buttons */}
                        <View style={styles.modalActions}>
                            {selectedCustomerOrder && !selectedCustomerOrder.delivered && (
                                <TouchableOpacity
                                    style={styles.modalConfirmBtn}
                                    onPress={() => {
                                        setDetailsModalVisible(false);
                                        handleConfirm(selectedCustomerOrder);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.modalConfirmBtnText}>✓ Confirm Handshake & Mark Delivered</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setDetailsModalVisible(false)}
                            >
                                <Text style={styles.modalCloseBtnText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        marginTop: 10,
        marginBottom: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
        padding: 0,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    activeTabButton: { backgroundColor: Colors.primary },
    tabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
    activeTabText: { color: '#FFFFFF' },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        marginTop: 10,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
    },
    deliveredCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.success,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderId: { fontSize: 16, fontWeight: '900', color: Colors.text },
    customerSummary: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    customerIconBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    customerIconBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemCount: { fontSize: 13, color: Colors.textMuted },
    priceText: { fontSize: 17, fontWeight: '900', color: Colors.primary },
    emailPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginVertical: 6,
    },
    emailPillText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
    productsBox: {
        backgroundColor: '#FAFAFA',
        padding: 8,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 8,
    },
    productLine: { fontSize: 12, color: Colors.textMuted, marginVertical: 1 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    confirmBtn: {
        backgroundColor: Colors.success,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    btnDisabled: { opacity: 0.6 },
    confirmBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    emptySubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
    modalSub: { fontSize: 13, color: Colors.primary, fontWeight: '700', marginTop: 2 },
    infoSection: { marginVertical: 8 },
    infoRow: { flexDirection: 'row', marginVertical: 6 },
    infoLabel: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
    emailHighlightBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginTop: 4,
    },
    emailHighlightText: { fontSize: 15, fontWeight: '800', color: '#065F46' },
    modalProdRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalProdName: { fontSize: 13, color: Colors.text, fontWeight: '500' },
    modalProdPrice: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    modalActions: { marginTop: 16, gap: 8 },
    modalConfirmBtn: {
        backgroundColor: Colors.success,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalConfirmBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    modalCloseBtn: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalCloseBtnText: { color: Colors.text, fontWeight: '700', fontSize: 14 },
});
