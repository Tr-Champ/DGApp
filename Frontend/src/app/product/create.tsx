import React, { useState } from 'react';
import { View, Text, Image, Alert, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../../services/imageService';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';

export default function CreateProductScreen() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // 1. Pick image from device gallery
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            const localUri = result.assets[0].uri;
            uploadToCloud(localUri);
        }
    };

    // 2. Upload image to Cloudinary using your imageService utility
    const uploadToCloud = async (localUri: string) => {
        setUploading(true);
        const secureUrl = await uploadImageToCloudinary(localUri);
        setUploading(false);

        if (secureUrl) {
            setImageUri(secureUrl);
            Alert.alert('Success', 'Image uploaded to Cloudinary successfully!');
        }
    };

    // 3. Register/Save product to FastAPI backend (Render)
    const handleRegisterProduct = async () => {
        if (!name || !price || !category || !imageUri) {
            return Alert.alert('Error', 'Please fill all fields and upload a product image.');
        }

        try {
            setLoading(true);
            await api.post('/products/', {
                name,
                price: parseFloat(price),
                category,
                quantity: parseInt(quantity || '1', 10),
                images: [imageUri], // Stored as a JSONB array string in PostgreSQL
                info: {}
            });

            Alert.alert('Success', 'Product registered successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            Alert.alert('Registration Failed', e.response?.data?.detail || 'Could not register product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Register Product</Text>

            <Input placeholder="Product Name" value={name} onChangeText={setName} />
            <Input placeholder="Price ($)" value={price} onChangeText={setPrice} keyboardType="numeric" />
            <Input placeholder="Category (e.g., Clothes, Shoes)" value={category} onChangeText={setCategory} />
            <Input placeholder="Stock Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />

            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
                <View style={styles.placeholderBox}>
                    <Text style={{ color: Colors.textMuted }}>No Image Selected</Text>
                </View>
            )}

            <Button title={uploading ? "Uploading to Cloudinary..." : "Select & Upload Image"} onPress={pickImage} />
            <Button title={loading ? "Registering..." : "Register Product"} onPress={handleRegisterProduct} loading={loading} style={{ backgroundColor: Colors.success, marginTop: 15 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: Colors.background },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginBottom: 20, textAlign: 'center' },
    previewImage: { width: '100%', height: 200, borderRadius: 8, marginVertical: 15, resizeMode: 'cover' },
    placeholderBox: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginVertical: 15 }
});