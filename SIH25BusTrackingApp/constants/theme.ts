/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Primary orange/amber palette
const primaryOrange = '#F59E0B'; // amber-500
const primaryOrangeDark = '#D97706'; // amber-600
const primaryOrangeLight = '#FDE68A'; // amber-200
const softBackground = '#FFFBEB'; // amber-50
const textDark = '#0F172A';
const textLight = '#F8FAFC';
const borderLight = '#F1F5F9';
const borderDark = '#334155';

const tintColorLight = primaryOrange;
const tintColorDark = textLight;

export const Colors = {
  light: {
    text: textDark,
    background: softBackground, // Use orange-tinted background
    tint: tintColorLight,
    icon: primaryOrangeDark,
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    mutedBackground: softBackground,
    border: borderLight,
  },
  dark: {
    text: textLight,
    background: '#0B1220',
    tint: tintColorDark,
    icon: primaryOrangeLight,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    card: '#0F172A',
    mutedBackground: '#0B1220',
    border: borderDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
