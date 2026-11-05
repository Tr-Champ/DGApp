import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  rightActionTitle?: string;
  onRightAction?: () => void;
  rightIcon?: React.ReactNode;
  showThemeToggle?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  badge,
  rightActionTitle,
  onRightAction,
  rightIcon,
  showThemeToggle = true,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          {badge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.primaryLight,
                  borderColor: isDark ? theme.colors.primary : '#BFDBFE',
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                {badge}
              </Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightGroup}>
        {showThemeToggle && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={18}
              color={isDark ? '#F59E0B' : theme.colors.primary}
            />
          </TouchableOpacity>
        )}

        {(rightActionTitle || rightIcon) && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={onRightAction}
          >
            {rightIcon}
            {rightActionTitle && (
              <Text style={styles.actionText}>{rightActionTitle}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
});
