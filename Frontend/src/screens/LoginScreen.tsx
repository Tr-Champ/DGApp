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
import { TextInputField } from '../components/TextInputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { theme } from '../theme';

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login, isLocked, unlockWithDevice, isDeviceLockSupported, user } = useAuth();

  const [username, setUsername] = useState('john');
  const [password, setPassword] = useState('teacher123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    <SafeAreaView style={styles.safeArea}>
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
            <View style={styles.iconCircle}>
              <Ionicons name="school" size={44} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Teacher Timetable</Text>
            <Text style={styles.titleHighlight}>Manager</Text>
            <Text style={styles.subtitle}>ABC Training Institution • Exam 2026</Text>
          </View>

          {/* Locked State Prompt (if teacher locked the app with phone screen lock) */}
          {isLocked && (
            <Card style={styles.lockedCard}>
              <View style={styles.lockedRow}>
                <Ionicons name="lock-closed" size={28} color={theme.colors.primary} />
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
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Login Card */}
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isLocked ? 'Or Log In with Credentials' : 'Sign In to Your Account'}
            </Text>

            <TextInputField
              label="Username"
              placeholder="e.g. john"
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
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              icon={<Ionicons name="log-in-outline" size={20} color={theme.colors.white} />}
              style={styles.loginBtn}
            />

            {/* Quick biometric unlock shortcut if supported and user was known */}
            {isDeviceLockSupported && !isLocked && user && (
              <TouchableOpacity
                style={styles.biometricShortcut}
                onPress={handleDeviceUnlock}
                activeOpacity={0.7}
              >
                <Ionicons name="finger-print" size={20} color={theme.colors.primary} />
                <Text style={styles.biometricShortcutText}>
                  Unlock with Phone Screen Lock
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.hintBox}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.muted} />
              <Text style={styles.hintText}>
                Default seed login:{' '}
                <Text style={styles.bold}>john</Text> /{' '}
                <Text style={styles.bold}>teacher123</Text>
              </Text>
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
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  title: {
    fontSize: theme.fontSize.title,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  titleHighlight: {
    fontSize: theme.fontSize.title,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginTop: 6,
    fontWeight: '500',
  },
  lockedCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    marginBottom: theme.spacing.lg,
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
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#92400E',
  },
  lockedSub: {
    fontSize: theme.fontSize.xs,
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
    backgroundColor: theme.colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  formCard: {
    padding: theme.spacing.xl,
  },
  formTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  loginBtn: {
    marginTop: theme.spacing.sm,
  },
  biometricShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  biometricShortcutText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hintText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.muted,
    marginLeft: 8,
    flex: 1,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.text,
  },
});
