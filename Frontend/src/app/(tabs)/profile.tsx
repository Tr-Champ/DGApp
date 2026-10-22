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
            <Text style={styles.email}>{user?.email}</Text>

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
    email: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: Colors.text },
    langContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
    activeLang: { backgroundColor: Colors.primary, paddingHorizontal: 10 },
    inactiveLang: { backgroundColor: Colors.textMuted, paddingHorizontal: 10 }
});