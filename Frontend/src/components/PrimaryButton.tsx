import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'outline' | 'secondary' | 'success';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  icon,
}) => {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';
  const isSuccess = variant === 'success';

  let backgroundColor = theme.colors.primary;
  let textColor = theme.colors.white;
  let borderColor = 'transparent';

  if (isOutline) {
    backgroundColor = 'transparent';
    textColor = theme.colors.primary;
    borderColor = theme.colors.primary;
  } else if (isDanger) {
    backgroundColor = theme.colors.danger;
  } else if (isSecondary) {
    backgroundColor = theme.colors.background;
    textColor = theme.colors.text;
    borderColor = theme.colors.border;
  } else if (isSuccess) {
    backgroundColor = theme.colors.success;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? '#CBD5E1' : backgroundColor,
          borderColor: disabled ? '#CBD5E1' : borderColor,
          borderWidth: isOutline || isSecondary ? 1 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? theme.colors.primary : theme.colors.white} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: disabled ? '#94A3B8' : textColor,
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  text: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
