const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'ttf']
  }
});

// Add this to fix the lightningcss issue
process.env.LIGHTNINGCSS_SKIP_NATIVE_CHECKS = "1";

module.exports = withNativeWind(config, { 
  input: "./global.css",
  // Add this configuration for better handling
  postcss: {
    plugins: [require("tailwindcss")]
  }
});