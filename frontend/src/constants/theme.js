import { MD3LightTheme } from 'react-native-paper';

/** Palette professionnelle hospitalière MedikaSN */
export const colors = {
  primary: '#2563EB',
  secondary: '#1E88E5',
  primaryDark: '#1E40AF',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  primarySoft: '#EFF6FF',
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primarySoft,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    onPrimary: '#FFFFFF',
    onSurface: colors.text,
    error: colors.error,
  },
};

export const BRAND = {
  name: 'MedikaSN',
  tagline: 'La santé digitale au Sénégal',
};
