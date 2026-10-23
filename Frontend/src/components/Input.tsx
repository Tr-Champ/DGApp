import React, { useState } from 'react';
import {
    TextInput,
    StyleSheet,
    View,
    TouchableOpacity,
    TextInputProps,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface InputProps extends TextInputProps {
    containerStyle?: StyleProp<ViewStyle>;
    isPassword?: boolean;
}

export default function Input({
    containerStyle,
    isPassword,
    secureTextEntry,
    style,
    ...props
}: InputProps) {
    const isPasswordField = isPassword || secureTextEntry;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, isPasswordField && styles.inputWithIcon, style]}
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={isPasswordField ? !isPasswordVisible : false}
                    {...props}
                />
                {isPasswordField && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setIsPasswordVisible((prev) => !prev)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={Colors.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 6,
        width: '100%',
    },
    inputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        fontSize: 15,
        color: Colors.text,
    },
    inputWithIcon: {
        paddingRight: 44,
    },
    iconButton: {
        position: 'absolute',
        right: 12,
        height: 24,
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});