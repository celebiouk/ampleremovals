module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Reanimated 4 moved its worklets engine to react-native-worklets;
      // this plugin (replaces the old react-native-reanimated/plugin) MUST be last.
      "react-native-worklets/plugin",
    ],
  };
};
