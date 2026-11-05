export interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  inputBg: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  white: string;
  black: string;
}

export const lightColors: ColorPalette = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  muted: '#64748B',
  border: '#E2E8F0',
  inputBg: '#FFFFFF',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  info: '#0284C7',
  infoLight: '#F0F9FF',
  white: '#FFFFFF',
  black: '#000000',
};

export const darkColors: ColorPalette = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#1E293B',
  background: '#0F172A',
  card: '#1E293B',
  cardBorder: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  muted: '#94A3B8',
  border: '#334155',
  inputBg: '#0F172A',
  danger: '#EF4444',
  dangerLight: '#450A0A',
  success: '#22C55E',
  successLight: '#052E16',
  warning: '#F59E0B',
  warningLight: '#451A03',
  info: '#38BDF8',
  infoLight: '#082F49',
  white: '#FFFFFF',
  black: '#000000',
};

const commonTypographyAndSpacing = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
  },
};

export const lightTheme = {
  colors: lightColors,
  ...commonTypographyAndSpacing,
  isDark: false,
};

export const darkTheme = {
  colors: darkColors,
  ...commonTypographyAndSpacing,
  isDark: true,
};

export type AppTheme = typeof lightTheme;
export const theme = lightTheme;
