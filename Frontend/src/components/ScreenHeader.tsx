import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  rightActionTitle?: string;
  onRightAction?: () => void;
  rightIcon?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  badge,
  rightActionTitle,
  onRightAction,
  rightIcon,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={styles.row}>
          <Text style={styles.title}>{title}</Text>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {(rightActionTitle || rightIcon) && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.actionButton}
          onPress={onRightAction}
        >
          {rightIcon}
          {rightActionTitle && (
            <Text style={styles.actionText}>{rightActionTitle}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
  },
  titleContainer: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.muted,
    marginTop: 3,
  },
  badge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    marginLeft: 4,
  },
});
