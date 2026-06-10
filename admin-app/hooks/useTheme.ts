import { useColorScheme } from "react-native";
import { colors } from "@/lib/colors";

export interface Theme {
  isDark: boolean;
  bg: string;          // screen background
  card: string;        // card surface
  cardBorder: string;
  text: string;        // primary text
  textSecondary: string;
  textMuted: string;
  separator: string;
  inputBg: string;
  inputBorder: string;
  tabBg: string;
  tabBorder: string;
  // brand colours (constant across themes)
  primary: string;
  accent: string;
}

const light: Theme = {
  isDark: false,
  bg: colors.slate[50],
  card: colors.white,
  cardBorder: colors.slate[100],
  text: colors.slate[900],
  textSecondary: colors.slate[600],
  textMuted: colors.slate[400],
  separator: colors.slate[100],
  inputBg: colors.white,
  inputBorder: colors.slate[300],
  tabBg: colors.white,
  tabBorder: colors.slate[100],
  primary: colors.primary.DEFAULT,
  accent: colors.accent.DEFAULT,
};

const dark: Theme = {
  isDark: true,
  bg: colors.slate[950],
  card: colors.slate[800],
  cardBorder: colors.slate[700],
  text: colors.slate[50],
  textSecondary: colors.slate[400],
  textMuted: colors.slate[600],
  separator: colors.slate[800],
  inputBg: colors.slate[800],
  inputBorder: colors.slate[700],
  tabBg: colors.slate[950],
  tabBorder: colors.slate[800],
  primary: colors.primary.DEFAULT,
  accent: colors.accent.DEFAULT,
};

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}
