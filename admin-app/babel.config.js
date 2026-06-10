module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Resolve the "@/..." path alias at compile time — deterministic in both
      // `expo start` and `expo export`, independent of Metro cache / tsconfig.
      [
        "module-resolver",
        {
          root: ["."],
          alias: { "@": "." },
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      ],
      // react-native-worklets/plugin (Reanimated 4) MUST be listed last.
      "react-native-worklets/plugin",
    ],
  };
};
