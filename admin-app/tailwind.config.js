/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind scans these files for className usage.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Loaded via expo-font in app/_layout.tsx. Names avoid colliding with
        // Tailwind's font-weight utilities (font-semibold/bold/medium).
        display: ["Syne_700Bold"],
        "display-sb": ["Syne_600SemiBold"],
        sans: ["DMSans_400Regular"],
        body: ["DMSans_400Regular"],
        "body-sb": ["DMSans_600SemiBold"],
      },
      colors: {
        // Brand — kept identical to the web platform.
        brand: {
          purple: {
            50: "#faf5ff",
            100: "#f3e8ff",
            500: "#a855f7",
            600: "#9333ea",
            700: "#7e22ce",
            800: "#6b21a8", // primary
            900: "#581c87",
          },
          green: {
            100: "#dcfce7",
            500: "#22c55e",
            600: "#16a34a", // accent
            700: "#15803d",
          },
        },
      },
    },
  },
  plugins: [],
};
