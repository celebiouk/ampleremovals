const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// This Expo app lives inside the Next.js repo. Metro resolves modules from the
// importing file upward, so the app's own node_modules/react (19 / SDK 54) is
// always found before the parent web app's React 18 — no extra config needed
// for correctness. We only ensure Metro does not WATCH the parent tree, to keep
// the bundler fast and scoped to this project.
config.watchFolders = [path.resolve(__dirname)];

module.exports = withNativeWind(config, { input: "./global.css" });
