import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert, Modal, ScrollView, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { uploadImageToCloudinary } from '../../services/imageService';
import { formatRWF } from '../../constants/i18n';

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    quantity: number;
    images: string[];
    info?: { description?: string;[key: string]: any };
}

const EMPTY_FORM = {
    name: '',
    price: '',
    category: '',
    quantity: '',
    description: '',
    imageUrlInput: '',
    images: [] as string[],
};

// In-memory cache for instant zero-spinner loading on tab navigation
let cachedAdminProducts: Product[] = [];

export default function AdminProductsCrud() {
    const [products, setProducts] = useState<Product[]>(cachedAdminProducts);
    const [loading, setLoading] = useState(cachedAdminProducts.length === 0);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<Product | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchProducts = useCallback(async (silent = false) => {
        try {
            if (!silent && cachedAdminProducts.length === 0) setLoading(true);
            const res = await api.get('/products/');
            const newProducts = res.data || [];
            cachedAdminProducts = newProducts;
            setProducts(newProducts);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts(cachedAdminProducts.length > 0);
    }, [fetchProducts]);

    const onRefresh = () => { setRefreshing(true); fetchProducts(true); };


    const openCreate = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setModalVisible(true);
    };

    const openEdit = (p: Product) => {
        setEditTarget(p);
        const productImages = Array.isArray(p.images) ? p.images : [];
        setForm({
            name: p.name,
            price: String(p.price),
            category: p.category,
            quantity: String(p.quantity),
            description: p.info?.description || '',
            imageUrlInput: '',
            images: productImages,
        });
        setModalVisible(true);
    };

    // Pick one or multiple images from device library
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: 10,
                quality: 0.7,
                base64: true, // Provides base64 for reliable Cloudinary upload
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setUploadingImage(true);
                const uploadedUrls: string[] = [];
                let failedCount = 0;

                for (const asset of result.assets) {
                    if (asset.uri) {
                        try {
                            const cloudUrl = await uploadImageToCloudinary({
                                uri: asset.uri,
                                base64: asset.base64,
                                mimeType: asset.mimeType,
                            });
                            // ONLY accept real Cloudinary / web URLs - NEVER local file:/// URIs
                            if (cloudUrl && cloudUrl.startsWith('http')) {
                                uploadedUrls.push(cloudUrl);
                            } else {
                                failedCount++;
                            }
                        } catch (err) {
                            console.error('[Cloud Upload Error]', err);
                            failedCount++;
                        }
                    }
                }

                if (uploadedUrls.length > 0) {
                    setForm((f) => ({
                        ...f,
                        images: [...f.images, ...uploadedUrls],
                    }));
                    Alert.alert(
                        'Upload Successful ☁️',
                        `Uploaded ${uploadedUrls.length} image(s)!` +
                        (failedCount > 0 ? ` (${failedCount} failed to upload)` : '')
                    );
                } else if (failedCount > 0) {
                    Alert.alert(
                        'Upload Failed',
                        'Could not upload images to Cloud. Please check your internet connection and try again.'
                    );
                }
            }
        } catch (e: any) {
            console.error('[ImagePicker Error]', e);
            Alert.alert('Error', 'Could not open device photo gallery.');
        } finally {
            setUploadingImage(false);
        }
    };

    // Add image URL manually
    const addImageUrl = () => {
        const trimmed = form.imageUrlInput.trim();
        if (!trimmed) return;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            return Alert.alert('Invalid URL', 'Please enter a valid web image URL (must start with https://).');
        }
        setForm((f) => ({
            ...f,
            images: [...f.images, trimmed],
            imageUrlInput: '',
        }));
    };

    // Remove single image from list
    const removeImage = (indexToRemove: number) => {
        setForm((f) => ({
            ...f,
            images: f.images.filter((_, idx) => idx !== indexToRemove),
        }));
    };

    const handleSave = async () => {
        const trimmedName = form.name.trim();
        const trimmedCategory = form.category.trim();
        const parsedPrice = parseFloat(form.price);

        if (!trimmedName || isNaN(parsedPrice) || !trimmedCategory) {
            return Alert.alert('Validation Error', 'Product name, valid price, and category are required.');
        }

        // Include any typed URL that hasn't been added yet
        let allImages = [...form.images];
        if (form.imageUrlInput.trim()) {
            allImages.push(form.imageUrlInput.trim());
        }

        // Strictly filter out any local file:// URIs so only Cloudinary/web URLs reach the database
        const finalImages = allImages.filter(img => typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://')));

        if (finalImages.length === 0 && allImages.length > 0) {
            return Alert.alert(
                'Image Upload Required',
                'Images must be uploaded to System (must start with https://). Local file paths are not allowed.'
            );
        }

        try {
            setSaving(true);
            const payload = {
                name: trimmedName,
                price: parsedPrice,
                category: trimmedCategory,
                quantity: parseInt(form.quantity || '0', 10),
                images: finalImages,
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
            fetchProducts(true);
            Alert.alert('Success', `Product ${editTarget ? 'updated' : 'created'} with ${finalImages.length} Cloud image(s)!`);
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
                renderItem={({ item }) => {
                    const validImages = Array.isArray(item.images) ? item.images.filter((img: any) => typeof img === 'string' && img.startsWith('http')) : [];
                    const imgCount = validImages.length;
                    const thumbUri = validImages[0];
                    return (
                        <View style={styles.card}>
                            <View style={styles.thumbWrapper}>
                                {thumbUri ? (
                                    <Image source={{ uri: thumbUri }} style={styles.thumb} />
                                ) : (
                                    <View style={[styles.thumb, styles.noImage]}>
                                        <Text style={{ fontSize: 10, color: Colors.textMuted }}>No Pic</Text>
                                    </View>
                                )}
                                {imgCount > 1 && (
                                    <View style={styles.thumbBadge}>
                                        <Text style={styles.thumbBadgeText}>{imgCount}</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.cardInfo}>
                                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.cardPrice}>{formatRWF(item.price)}</Text>
                                <Text style={styles.cardMeta}>{item.category} · {item.quantity} items</Text>
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
                    );
                }}
            />

            {/* Product Edit / Create Modal */}
            <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
                    <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled">
                        <Text style={styles.modalTitle}>{editTarget ? 'Edit Product' : 'Add New Product'}</Text>

                        <Text style={styles.modalLabel}>Product Name *</Text>
                        <Input placeholder="e.g. Leather Handbag" value={form.name} onChangeText={(v: string) => setForm((f) => ({ ...f, name: v }))} />

                        <Text style={styles.modalLabel}>Price (RWF) *</Text>
                        <Input placeholder="e.g. 25000" value={form.price} onChangeText={(v: string) => setForm((f) => ({ ...f, price: v }))} keyboardType="numeric" />

                        <Text style={styles.modalLabel}>Category *</Text>
                        <Input placeholder="Clothes, Shoes, Bags, Household, Jewelry, Cosmetics" value={form.category} onChangeText={(v: string) => setForm((f) => ({ ...f, category: v }))} />

                        <Text style={styles.modalLabel}>#Items (Number of Copies)</Text>
                        <Input placeholder="e.g. 20" value={form.quantity} onChangeText={(v: string) => setForm((f) => ({ ...f, quantity: v }))} keyboardType="numeric" />


                        <Text style={styles.modalLabel}>Description</Text>
                        <Input placeholder="Product details, sizes, colors..." value={form.description} onChangeText={(v: string) => setForm((f) => ({ ...f, description: v }))} multiline numberOfLines={3} />

                        {/* Multiple Images Management Section */}
                        <Text style={styles.modalLabel}>
                            Product Images ({form.images.length})
                        </Text>
                        <Text style={styles.helperText}>
                            Add multiple images so customers can swipe left/right (1/5).
                        </Text>

                        {/* Horizontal Image Thumbnails */}
                        {form.images.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbsScroll}>
                                {form.images.map((imgUri, idx) => (
                                    <View key={idx} style={styles.thumbPreviewCard}>
                                        <Image source={{ uri: imgUri }} style={styles.thumbPreviewImg} />
                                        <TouchableOpacity
                                            style={styles.thumbDeleteBtn}
                                            onPress={() => removeImage(idx)}
                                            activeOpacity={0.7}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                                        </TouchableOpacity>
                                        <View style={styles.thumbIndexBadge}>
                                            <Text style={styles.thumbIndexText}>{idx + 1}</Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={styles.placeholderBox}>
                                <Ionicons name="images-outline" size={32} color={Colors.textMuted} style={{ marginBottom: 4 }} />
                                <Text style={{ color: Colors.textMuted, fontSize: 13 }}>No images added yet</Text>
                            </View>
                        )}

                        <Button
                            title={uploadingImage ? "Uploading Images to Cloud..." : "📷 Pick Multiple Images from Gallery"}
                            onPress={pickImage}
                            loading={uploadingImage}
                            style={{ backgroundColor: '#4B5563', marginVertical: 6 }}
                        />

                        {/* Add image URL input */}
                        <View style={styles.urlInputRow}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    placeholder="Or paste image URL"
                                    value={form.imageUrlInput}
                                    onChangeText={(v: string) => setForm((f) => ({ ...f, imageUrlInput: v }))}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.addUrlBtn}
                                onPress={addImageUrl}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.addUrlBtnText}>+ Add URL</Text>
                            </TouchableOpacity>
                        </View>

                        <Button
                            title={saving ? 'Saving...' : `Save Product (${form.images.length} images)`}
                            onPress={handleSave}
                            loading={saving}
                            style={{ backgroundColor: Colors.primary, marginTop: 14 }}
                        />
                        <Button
                            title="Cancel"
                            onPress={() => setModalVisible(false)}
                            style={{ backgroundColor: '#EF4444', marginVertical: 8 }}
                        />
                    </ScrollView>
                </SafeAreaView>
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
    thumbWrapper: {
        position: 'relative',
        width: 64,
        height: 64,
    },
    thumb: {
        width: 64,
        height: 64,
        borderRadius: 8,
        resizeMode: 'cover',
        backgroundColor: Colors.border,
    },
    thumbBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: Colors.primary,
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    thumbBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
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
    modalContainer: { padding: 20, backgroundColor: Colors.background, flexGrow: 1, paddingBottom: 40 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: 16, textAlign: 'center' },
    modalLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 10, marginBottom: 2 },
    helperText: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
    thumbsScroll: {
        flexDirection: 'row',
        marginVertical: 10,
        paddingVertical: 4,
    },
    thumbPreviewCard: {
        position: 'relative',
        width: 80,
        height: 80,
        marginRight: 12,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    thumbPreviewImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    thumbDeleteBtn: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    thumbIndexBadge: {
        position: 'absolute',
        bottom: 2,
        left: 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 5,
        borderRadius: 4,
    },
    thumbIndexText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    placeholderBox: {
        width: '100%',
        height: 90,
        borderRadius: 10,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    urlInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 4,
    },
    addUrlBtn: {
        backgroundColor: Colors.secondary,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addUrlBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
});
