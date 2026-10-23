import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert, Modal, ScrollView, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { uploadImageToCloudinary } from '../../services/imageService';

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    quantity: number;
    images: string[];
    info?: { description?: string; [key: string]: any };
}

const EMPTY_FORM = {
    name: '',
    price: '',
    category: '',
    quantity: '',
    description: '',
    imageUrl: '',
    images: [] as string[],
};

export default function AdminProductsCrud() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<Product | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await api.get('/products/');
            setProducts(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const onRefresh = () => { setRefreshing(true); fetchProducts(); };

    const openCreate = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModalVisible(true);
    };

    const openEdit = (p: Product) => {
        setEditTarget(p);
        const firstImg = p.images?.[0] || '';
        setForm({
            name: p.name,
            price: String(p.price),
            category: p.category,
            quantity: String(p.quantity),
            description: p.info?.description || '',
            imageUrl: firstImg,
            images: p.images || [],
        });
        setModalVisible(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0].uri) {
            const localUri = result.assets[0].uri;
            setUploadingImage(true);
            try {
                const cloudUrl = await uploadImageToCloudinary(localUri);
                const finalUrl = cloudUrl || localUri;
                setForm((f) => ({
                    ...f,
                    imageUrl: finalUrl,
                    images: [finalUrl],
                }));
            } catch (err) {
                setForm((f) => ({
                    ...f,
                    imageUrl: localUri,
                    images: [localUri],
                }));
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const handleSave = async () => {
        const trimmedName = form.name.trim();
        const trimmedCategory = form.category.trim();
        const parsedPrice = parseFloat(form.price);

        if (!trimmedName || isNaN(parsedPrice) || !trimmedCategory) {
            return Alert.alert('Validation Error', 'Product name, valid price, and category are required.');
        }

        const imagesToSave = form.imageUrl.trim()
            ? [form.imageUrl.trim()]
            : form.images;

        try {
            setSaving(true);
            const payload = {
                name: trimmedName,
                price: parsedPrice,
                category: trimmedCategory,
                quantity: parseInt(form.quantity || '0', 10),
                images: imagesToSave,
                info: {
                    description: form.description.trim(),
                },
            };

            if (editTarget) {
                await api.put(`/products/${editTarget.id}`, payload);
            } else {
                await api.post('/products/', payload);
            }

            setModalVisible(false);
            fetchProducts();
            Alert.alert('Success', `Product ${editTarget ? 'updated' : 'created'} successfully!`);
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Could not save product.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (p: Product) => {
        Alert.alert('Confirm Deletion', `Are you sure you want to delete "${p.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/products/${p.id}`);
                        fetchProducts();
                        Alert.alert('Deleted', 'Product was removed successfully.');
                    } catch (e: any) {
                        Alert.alert('Error', e.response?.data?.detail || 'Could not delete product.');
                    }
                },
            },
        ]);
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />;

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>+ Add New Product</Text>
            </TouchableOpacity>

            <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No products yet. Tap "+ Add New Product" to populate your catalog.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {item.images?.[0] ? (
                            <Image source={{ uri: item.images[0] }} style={styles.thumb} />
                        ) : (
                            <View style={[styles.thumb, styles.noImage]}>
                                <Text style={{ fontSize: 10, color: Colors.textMuted }}>No Pic</Text>
                            </View>
                        )}
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
                            <Text style={styles.cardMeta}>{item.category} · In Stock: {item.quantity}</Text>
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>{editTarget ? 'Edit Product' : 'Add New Product'}</Text>

                    <Text style={styles.modalLabel}>Product Name *</Text>
                    <Input placeholder="e.g. Leather Handbag" value={form.name} onChangeText={(v: string) => setForm((f) => ({ ...f, name: v }))} />

                    <Text style={styles.modalLabel}>Price ($) *</Text>
                    <Input placeholder="e.g. 49.99" value={form.price} onChangeText={(v: string) => setForm((f) => ({ ...f, price: v }))} keyboardType="numeric" />

                    <Text style={styles.modalLabel}>Category *</Text>
                    <Input placeholder="Clothes, Shoes, Bags, Household, Jewelry, Cosmetics" value={form.category} onChangeText={(v: string) => setForm((f) => ({ ...f, category: v }))} />

                    <Text style={styles.modalLabel}>Stock Quantity</Text>
                    <Input placeholder="e.g. 25" value={form.quantity} onChangeText={(v: string) => setForm((f) => ({ ...f, quantity: v }))} keyboardType="numeric" />

                    <Text style={styles.modalLabel}>Description</Text>
                    <Input placeholder="Product details, sizes, colors..." value={form.description} onChangeText={(v: string) => setForm((f) => ({ ...f, description: v }))} multiline numberOfLines={3} />

                    <Text style={styles.modalLabel}>Image URL (or select from phone)</Text>
                    <Input placeholder="https://example.com/image.jpg" value={form.imageUrl} onChangeText={(v: string) => setForm((f) => ({ ...f, imageUrl: v }))} />

                    {form.imageUrl ? (
                        <Image source={{ uri: form.imageUrl }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholderBox}>
                            <Text style={{ color: Colors.textMuted }}>No Image Selected</Text>
                        </View>
                    )}

                    <Button
                        title={uploadingImage ? "Uploading to Cloud..." : "Pick Image From Gallery"}
                        onPress={pickImage}
                        loading={uploadingImage}
                        style={{ backgroundColor: '#4B5563', marginVertical: 8 }}
                    />
                    <Button
                        title={saving ? 'Saving...' : 'Save Product'}
                        onPress={handleSave}
                        loading={saving}
                        style={{ backgroundColor: Colors.primary, marginVertical: 8 }}
                    />
                    <Button
                        title="Cancel"
                        onPress={() => setModalVisible(false)}
                        style={{ backgroundColor: '#EF4444', marginVertical: 8 }}
                    />
                </ScrollView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    addBtn: {
        backgroundColor: Colors.primary,
        margin: 14,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
        shadowColor: Colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 14,
        marginBottom: 12,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    thumb: {
        width: 64,
        height: 64,
        borderRadius: 8,
        resizeMode: 'cover',
        backgroundColor: Colors.border,
    },
    noImage: {
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: { flex: 1, marginLeft: 14 },
    cardName: { fontSize: 15, fontWeight: '700', color: Colors.text },
    cardPrice: { fontSize: 14, color: Colors.primary, fontWeight: '700', marginTop: 3 },
    cardMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    cardActions: { gap: 8 },
    editBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
    },
    editBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    deleteBtn: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
    },
    deleteBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 30 },
    emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
    modalContainer: { padding: 20, backgroundColor: Colors.background, flexGrow: 1 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: 16, textAlign: 'center' },
    modalLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 2 },
    previewImage: { width: '100%', height: 180, borderRadius: 10, marginVertical: 12, resizeMode: 'cover' },
    placeholderBox: { width: '100%', height: 140, borderRadius: 10, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginVertical: 12 },
});
