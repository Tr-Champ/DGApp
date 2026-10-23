import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Colors } from '../../constants/Colors';
import { Language } from '../../constants/i18n';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function ProfileScreen() {
    const { user, logout, deleteAccount } = useAuth();
    const { lang, t, setLang } = useLanguage();

    // Delete account modal state
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteEmail, setDeleteEmail] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [deletePasswordVisible, setDeletePasswordVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleLogout = async () => {
        Alert.alert(
            t.logout,
            lang === 'en'
                ? 'Are you sure you want to log out?'
                : lang === 'rw'
                ? 'Urashaka gusohoka?'
                : 'Êtes-vous sûr de vouloir vous déconnecter?',
            [
                { text: t.cancel, style: 'cancel' },
                { text: t.logout, style: 'destructive', onPress: logout },
            ]
        );
    };

    const openDeleteModal = () => {
        setDeleteEmail('');
        setDeletePassword('');
        setDeleteModalVisible(true);
    };

    const handleDeleteAccount = async () => {
        if (!deleteEmail.trim()) {
            return Alert.alert(t.error, t.enterEmailToConfirm);
        }
        if (!deletePassword.trim()) {
            return Alert.alert(t.error, t.enterPasswordToConfirm);
        }

        Alert.alert(
            t.deleteAccountTitle,
            t.deleteAccountConfirm,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.deleteAccount,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await deleteAccount(deleteEmail.trim(), deletePassword);
                            setDeleteModalVisible(false);
                            Alert.alert(t.accountDeleted, t.accountDeletedMsg);
                        } catch (e: any) {
                            const msg = e?.response?.data?.detail || e?.message || 'Could not delete account.';
                            Alert.alert(t.error, msg);
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Avatar & Account Badge */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={44} color="#FFFFFF" />
                    </View>
                    {user?.is_admin && (
                        <View style={styles.adminBadge}>
                            <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.adminBadgeText}>Administrator</Text>
                        </View>
                    )}
                    <Text style={styles.emailText}>{user?.email}</Text>
                    <Text style={styles.roleSubtext}>{user?.is_admin ? t.admin : lang === 'rw' ? 'Umukiriya' : lang === 'fr' ? 'Client' : 'Customer'}</Text>
                </View>

                {/* Language Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="language-outline" size={15} /> {'  '}{t.language}
                    </Text>
                    <View style={styles.langRow}>
                        {LANGUAGES.map((l) => (
                            <TouchableOpacity
                                key={l.code}
                                style={[styles.langBtn, lang === l.code && styles.langBtnActive]}
                                onPress={() => setLang(l.code)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.langFlag}>{l.flag}</Text>
                                <Text style={[styles.langLabel, lang === l.code && styles.langLabelActive]}>
                                    {l.label}
                                </Text>
                                {lang === l.code && (
                                    <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Account Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="person-circle-outline" size={15} /> {'  '}{t.accountInfo}
                    </Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.infoLabel}>{t.emailLabel}</Text>
                                <Text style={styles.infoValue} selectable>{user?.email}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="shield-outline" size={18} color={Colors.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.infoLabel}>{lang === 'rw' ? 'Urwego' : lang === 'fr' ? 'Rôle' : 'Account Role'}</Text>
                                <Text style={styles.infoValue}>{user?.is_admin ? 'Administrator' : 'Customer'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={[styles.section, styles.dangerSection]}>
                    <Text style={[styles.sectionTitle, { color: Colors.error }]}>
                        <Ionicons name="warning-outline" size={15} /> {'  '}{lang === 'rw' ? 'Akarere Gakomeye' : lang === 'fr' ? 'Zone Dangereuse' : 'Danger Zone'}
                    </Text>
                    <TouchableOpacity style={styles.dangerBtn} onPress={openDeleteModal} activeOpacity={0.8}>
                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        <Text style={styles.dangerBtnText}>{t.deleteAccount}</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.logoutBtnText}>{t.logout}</Text>
                </TouchableOpacity>

                <Text style={styles.appVersion}>DG Retail App · v1.0.0</Text>
            </ScrollView>

            {/* DELETE ACCOUNT MODAL */}
            <Modal
                visible={deleteModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => {
                    if (!isDeleting) setDeleteModalVisible(false);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="warning" size={28} color={Colors.error} />
                            <Text style={styles.modalTitle}>{t.deleteAccountTitle}</Text>
                            {!isDeleting && (
                                <TouchableOpacity
                                    onPress={() => setDeleteModalVisible(false)}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.modalWarning}>{t.deleteAccountConfirm}</Text>

                        <Text style={styles.inputLabel}>{t.emailLabel}</Text>
                        <TextInput
                            style={styles.input}
                            value={deleteEmail}
                            onChangeText={setDeleteEmail}
                            placeholder={t.enterEmailToConfirm}
                            placeholderTextColor={Colors.textMuted}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!isDeleting}
                        />

                        <Text style={styles.inputLabel}>{t.passwordLabel}</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                value={deletePassword}
                                onChangeText={setDeletePassword}
                                placeholder={t.enterPasswordToConfirm}
                                placeholderTextColor={Colors.textMuted}
                                secureTextEntry={!deletePasswordVisible}
                                editable={!isDeleting}
                            />
                            <TouchableOpacity
                                style={styles.eyeToggle}
                                onPress={() => setDeletePasswordVisible((v) => !v)}
                            >
                                <Ionicons
                                    name={deletePasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                                    size={22}
                                    color={Colors.textMuted}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalCancelBtn, isDeleting && { opacity: 0.5 }]}
                                onPress={() => setDeleteModalVisible(false)}
                                disabled={isDeleting}
                            >
                                <Text style={styles.modalCancelText}>{t.cancel}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalDeleteBtn, isDeleting && { opacity: 0.7 }]}
                                onPress={handleDeleteAccount}
                                disabled={isDeleting}
                                activeOpacity={0.8}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="trash" size={16} color="#FFFFFF" />
                                        <Text style={styles.modalDeleteText}>{t.deleteAccount}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

    // Avatar
    avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 12,
    },
    adminBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 14,
        marginBottom: 10,
    },
    adminBadgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
    emailText: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 4 },
    roleSubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },

    // Sections
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 1,
    },
    dangerSection: {
        borderColor: '#FECACA',
        backgroundColor: '#FFF5F5',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 0.5,
        marginBottom: 12,
        textTransform: 'uppercase',
    },

    // Language
    langRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    langBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 100,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    langBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    langFlag: { fontSize: 18, marginRight: 6 },
    langLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, flex: 1 },
    langLabelActive: { color: '#FFFFFF' },

    // Info card
    infoCard: { gap: 0 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    infoDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
    infoLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
    infoValue: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },

    // Danger
    dangerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
        gap: 10,
    },
    dangerBtnText: { color: Colors.error, fontWeight: '700', fontSize: 15, flex: 1 },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.error,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 10,
        marginBottom: 14,
        elevation: 2,
    },
    logoutBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
    appVersion: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 4 },

    // Delete Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.error, flex: 1 },
    modalWarning: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 21,
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        color: Colors.text,
        marginBottom: 12,
    },
    passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    eyeToggle: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginLeft: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 13,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: { color: Colors.text, fontWeight: '700', fontSize: 14 },
    modalDeleteBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 13,
        backgroundColor: Colors.error,
        borderRadius: 12,
        gap: 8,
    },
    modalDeleteText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});