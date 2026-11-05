import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { TextInputField } from '../components/TextInputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login, isLocked, unlockWithDevice, isDeviceLockSupported, user } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const [activeRole, setActiveRole] = useState<'teacher' | 'admin'>('teacher');
  const [username, setUsername] = useState('john');
  const [password, setPassword] = useState('teacher123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectRole = (role: 'teacher' | 'admin') => {
    setActiveRole(role);
    setErrorMsg('');
    if (role === 'teacher') {
      setUsername('john');
      setPassword('teacher123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceUnlock = async () => {
    setErrorMsg('');
    const success = await unlockWithDevice();
    if (!success) {
      Alert.alert('Phone Lock Verification', 'Authentication was cancelled or failed.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Theme Switcher Button in Top Right */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[
            styles.themeBtn,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={20}
            color={isDark ? '#F59E0B' : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Branding */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="school" size={44} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Teacher Timetable</Text>
            <Text style={[styles.titleHighlight, { color: theme.colors.primary }]}>Manager</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
              ABC Training Institution • Exam 2026
            </Text>
          </View>

          {/* Locked State Prompt (if teacher locked the app with phone screen lock) */}
          {isLocked && (
            <Card style={styles.lockedCard}>
              <View style={styles.lockedRow}>
                <Ionicons name="lock-closed" size={28} color="#D97706" />
                <View style={styles.lockedTextContainer}>
                  <Text style={styles.lockedTitle}>App is Locked</Text>
                  <Text style={styles.lockedSub}>
                    Signed in as {user?.username}. Unlock with your phone screen lock (fingerprint, face, or PIN).
                  </Text>
                </View>
              </View>
              <PrimaryButton
                title="Unlock with Phone Lock"
                onPress={handleDeviceUnlock}
                icon={<Ionicons name="finger-print" size={20} color={theme.colors.white} />}
                style={styles.unlockBtn}
              />
            </Card>
          )}

          {/* Error Banner */}
          {errorMsg ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.colors.dangerLight }]}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Login Card */}
          <Card style={styles.formCard}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>
              {isLocked ? 'Or Log In with Credentials' : 'Sign In to Your Account'}
            </Text>

            {/* Quick Role Switcher Chips */}
            <Text style={[styles.rolePickerLabel, { color: theme.colors.muted }]}>
              Select Account Type:
            </Text>
            <View style={styles.roleSwitcherRow}>
              <TouchableOpacity
                style={[
                  styles.roleChip,
                  {
                    backgroundColor: activeRole === 'teacher' ? theme.colors.primary : theme.colors.card,
                    borderColor: activeRole === 'teacher' ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => selectRole('teacher')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person"
                  size={16}
                  color={activeRole === 'teacher' ? '#FFFFFF' : theme.colors.primary}
                />
                <Text
                  style={[
                    styles.roleChipText,
                    { color: activeRole === 'teacher' ? '#FFFFFF' : theme.colors.textSecondary },
                  ]}
                >
                  Teacher (john)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleChip,
                  {
                    backgroundColor: activeRole === 'admin' ? '#7C3AED' : theme.colors.card,
                    borderColor: activeRole === 'admin' ? '#7C3AED' : theme.colors.border,
                  },
                ]}
                onPress={() => selectRole('admin')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={16}
                  color={activeRole === 'admin' ? '#FFFFFF' : '#7C3AED'}
                />
                <Text
                  style={[
                    styles.roleChipText,
                    { color: activeRole === 'admin' ? '#FFFFFF' : theme.colors.textSecondary },
                  ]}
                >
                  Admin (admin)
                </Text>
              </TouchableOpacity>
            </View>

            <TextInputField
              label="Username"
              placeholder="e.g. john or admin"
              autoCapitalize="none"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setErrorMsg('');
              }}
            />

            <TextInputField
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMsg('');
              }}
            />

            <PrimaryButton
              title={activeRole === 'admin' ? 'Sign In as Administrator' : 'Sign In as Teacher'}
              onPress={handleLogin}
              loading={loading}
              icon={<Ionicons name="log-in-outline" size={20} color="#FFFFFF" />}
              style={activeRole === 'admin' ? styles.loginBtnAdmin : styles.loginBtn}
            />

            {/* Quick biometric unlock shortcut if supported and user was known */}
            {isDeviceLockSupported && !isLocked && user && (
              <TouchableOpacity
                style={styles.biometricShortcut}
                onPress={handleDeviceUnlock}
                activeOpacity={0.7}
              >
                <Ionicons name="finger-print" size={20} color={theme.colors.primary} />
                <Text style={[styles.biometricShortcutText, { color: theme.colors.primary }]}>
                  Unlock with Phone Screen Lock
                </Text>
              </TouchableOpacity>
            )}

            {/* Default Accounts Info Box */}
            <View
              style={[
                styles.hintBox,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.muted} />
              <View style={styles.hintContent}>
                <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
                  👨‍🏫 <Text style={[styles.bold, { color: theme.colors.text }]}>Teacher:</Text> john / teacher123
                </Text>
                <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
                  🛠️ <Text style={[styles.bold, { color: theme.colors.text }]}>Admin:</Text> admin / admin123
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleHighlight: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  lockedCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  lockedSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  unlockBtn: {
    backgroundColor: '#D97706',
    height: 44,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  formCard: {
    padding: 20,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  rolePickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roleSwitcherRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  loginBtn: {
    marginTop: 8,
  },
  loginBtnAdmin: {
    marginTop: 8,
    backgroundColor: '#7C3AED',
  },
  biometricShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  biometricShortcutText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  hintContent: {
    marginLeft: 8,
    flex: 1,
    gap: 3,
  },
  hintText: {
    fontSize: 12,
  },
  bold: {
    fontWeight: '700',
  },
});
