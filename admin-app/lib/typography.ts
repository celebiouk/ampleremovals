import { Platform, type TextStyle } from "react-native";

/**
 * Font family keys — these match the names registered via useFonts() in the
 * root layout (the @expo-google-fonts export names).
 */
export const fonts = {
  displayBold: "Syne_700Bold",
  displaySemiBold: "Syne_600SemiBold",
  bodyRegular: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodySemiBold: "DMSans_600SemiBold",
  bodyBold: "DMSans_700Bold",
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string,
} as const;

/**
 * Type scale. Colour is intentionally omitted — it comes from the theme so
 * the same style works in light and dark mode.
 */
export const type = {
  display: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.displaySemiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.bodySemiBold, fontSize: 18, lineHeight: 24 },
  bodyLarge: { fontFamily: fonts.bodyRegular, fontSize: 16, lineHeight: 24 },
  bodyLargeSemiBold: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 20 },
  bodySemiBold: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20 },
  bodySmall: { fontFamily: fonts.bodyRegular, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: "uppercase" },
  button: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 20, letterSpacing: 0.2 },
  mono: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 18 },
  monoLarge: { fontFamily: fonts.mono, fontSize: 20, lineHeight: 24, fontWeight: "700" },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
