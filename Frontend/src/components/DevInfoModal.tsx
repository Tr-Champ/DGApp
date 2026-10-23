import React, { useState } from 'react';
import {
    View, Text, Modal, TouchableOpacity, StyleSheet,
    Linking, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEV = {
    name: 'Samuel N.',
    role: 'FreeLancer Full-Stack Developer',
    ig: 'https://www.instagram.com/deveagle2050',
    x: 'https://x.com/deveagle2050',
    email: 'nsamuel10000@gmail.com',
    handle: '@deveagle2050',
};

export function DevIcon() {
    const [visible, setVisible] = useState(false);

    const open = (url: string) => {
        Linking.openURL(url).catch(() => { });
    };

    return (
        <>
            {/* Tiny icon shown in header top-right */}
            <TouchableOpacity
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
                style={styles.headerIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="code-slash-outline" size={19} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Developer Info Modal */}
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
                statusBarTranslucent
            >
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                        {/* Green top strip */}
                        <View style={styles.gradientStrip} />

                        {/* Avatar circle floating over strip */}
                        <View style={styles.avatarWrap}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={32} color="#FFFFFF" />
                            </View>
                        </View>

                        <Text style={styles.devName}>{DEV.name}</Text>
                        <Text style={styles.devRole}>{DEV.role}</Text>
                        <Text style={styles.devHandle}>{DEV.handle}</Text>

                        <View style={styles.divider} />

                        {/* Instagram + X Buttons */}
                        <View style={styles.socials}>
                            <TouchableOpacity
                                style={[styles.socialBtn, styles.igBtn]}
                                onPress={() => open(DEV.ig)}
                                activeOpacity={0.82}
                            >
                                <Ionicons name="logo-instagram" size={18} color="#FFFFFF" />
                                <Text style={styles.socialBtnText}>Instagram</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.socialBtn, styles.xBtn]}
                                onPress={() => open(DEV.x)}
                                activeOpacity={0.82}
                            >
                                <Ionicons name="logo-twitter" size={18} color="#FFFFFF" />
                                <Text style={styles.socialBtnText}>X (Twitter)</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Email row */}
                        <TouchableOpacity
                            style={styles.emailRow}
                            onPress={() => open(`mailto:${DEV.email}`)}
                            activeOpacity={0.75}
                        >
                            <View style={styles.emailIconWrap}>
                                <Ionicons name="mail-outline" size={16} color="#10B981" />
                            </View>
                            <Text style={styles.emailText}>{DEV.email}</Text>
                            <Ionicons name="open-outline" size={13} color="#6B7280" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>

                        {/* Close button */}
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setVisible(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    headerIcon: {
        marginRight: 14,
        opacity: 0.92,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        overflow: 'hidden',
        paddingBottom: 24,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
    },
    gradientStrip: {
        width: '100%',
        height: 70,
        backgroundColor: '#10B981',
    },
    avatarWrap: {
        marginTop: -36,
        marginBottom: 10,
        padding: 3,
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
    },
    avatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#10B981',
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    devName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: 0.3,
    },
    devRole: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
        fontWeight: '500',
    },
    devHandle: {
        fontSize: 13,
        color: '#10B981',
        marginTop: 4,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    divider: {
        width: '80%',
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 14,
    },
    socials: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
        paddingHorizontal: 20,
        width: '100%',
    },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 12,
        gap: 7,
        elevation: 3,
    },
    igBtn: {
        backgroundColor: '#E1306C',
        shadowColor: '#E1306C',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    xBtn: {
        backgroundColor: '#1DA1F2',
        shadowColor: '#1DA1F2',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    socialBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginHorizontal: 20,
        marginBottom: 16,
        gap: 8,
        width: '88%',
    },
    emailIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emailText: {
        flex: 1,
        fontSize: 12.5,
        color: '#065F46',
        fontWeight: '600',
    },
    closeBtn: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 32,
        paddingVertical: 11,
        borderRadius: 12,
    },
    closeBtnText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '700',
    },
});
