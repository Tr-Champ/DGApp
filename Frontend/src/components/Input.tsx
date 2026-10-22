import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';

export default function Input(props: any) {
    return (
        <View style={styles.container}>
            <TextInput style={styles.input} placeholderTextColor={Colors.textMuted} {...props} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginVertical: 8, width: '100%' },
    input: { borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', padding: 12, borderRadius: 8, fontSize: 16, color: Colors.text }
});