module.exports = {
  presets: [
    [
      "module:metro-react-native-babel-preset",
      { unstable_transformProfile: "hermes-stable" },
    ],
  ],
  env: {
    production: {
      plugins: ['transform-remove-console']
    }
  },
  plugins: [
    [
      "module:react-native-dotenv",
      {
        envName: "APP_ENV",
        moduleName: "@env",
        path: ".env.production",
        safe: true,
        allowUndefined: false,
        verbose: false,
      },
    ],
  ],
};