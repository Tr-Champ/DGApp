import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

export default function Button({ title, onPress, loading, style }: any) {
    return (
        <TouchableOpacity style={[styles.btn, style]} onPress={onPress} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.txt}>{title}</Text>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: { backgroundColor: Colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
    txt: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});