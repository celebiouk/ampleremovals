const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// This Expo app lives inside the Next.js repo. Keep Metro scoped to this project
// so the bundler is fast and resolves this app's own node_modules first.
config.watchFolders = [path.resolve(__dirname)];

module.exports = withNativeWind(config, { input: "./global.css" });
