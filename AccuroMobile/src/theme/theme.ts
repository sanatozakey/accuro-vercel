import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { COLORS } from '../constants/colors';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primaryLight,
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.secondaryLight,
    tertiary: COLORS.info,
    error: COLORS.error,
    errorContainer: COLORS.errorLight,
    background: COLORS.background.light,
    surface: COLORS.surface.light,
    surfaceVariant: COLORS.gray[100],
    onPrimary: COLORS.white,
    onSecondary: COLORS.white,
    onBackground: COLORS.text.primary,
    onSurface: COLORS.text.primary,
    outline: COLORS.border.light,
    success: COLORS.success,
    warning: COLORS.warning,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primaryLight,
    primaryContainer: COLORS.primaryDark,
    secondary: COLORS.secondaryLight,
    secondaryContainer: COLORS.secondaryDark,
    tertiary: COLORS.infoLight,
    error: COLORS.errorLight,
    errorContainer: COLORS.errorDark,
    background: COLORS.background.dark,
    surface: COLORS.surface.dark,
    surfaceVariant: COLORS.gray[800],
    onPrimary: COLORS.black,
    onSecondary: COLORS.black,
    onBackground: COLORS.white,
    onSurface: COLORS.white,
    outline: COLORS.border.dark,
    success: COLORS.successLight,
    warning: COLORS.warningLight,
  },
};
