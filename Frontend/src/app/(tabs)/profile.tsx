import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { translations, Language } from '../../constants/i18n';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const [lang, setLang] = useState<Language>('en');
    const t = translations[lang];

    return (
        <View style={styles.container}>
            {user?.is_admin && (
                <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>👑 Admin Account</Text>
                </View>
            )}

            <Text style={styles.email}>{user?.email}</Text>

            <Text style={styles.sectionLabel}>Language</Text>
            <View style={styles.langContainer}>
                <Button title="English" onPress={() => setLang('en')} style={lang === 'en' ? styles.activeLang : styles.inactiveLang} />
                <Button title="Kinyarwanda" onPress={() => setLang('rw')} style={lang === 'rw' ? styles.activeLang : styles.inactiveLang} />
                <Button title="Français" onPress={() => setLang('fr')} style={lang === 'fr' ? styles.activeLang : styles.inactiveLang} />
            </View>

            <Button title={t.logout} onPress={logout} style={{ backgroundColor: Colors.error, marginTop: 30 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: Colors.background, justifyContent: 'center' },
    adminBadge: {
        backgroundColor: Colors.secondary, borderRadius: 20, paddingVertical: 6,
        paddingHorizontal: 16, alignSelf: 'center', marginBottom: 16,
    },
    adminBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    email: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: Colors.text },
    sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textAlign: 'center', marginBottom: 8, marginTop: 16 },
    langContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
    activeLang: { backgroundColor: Colors.primary, paddingHorizontal: 10 },
    inactiveLang: { backgroundColor: Colors.textMuted, paddingHorizontal: 10 },
});