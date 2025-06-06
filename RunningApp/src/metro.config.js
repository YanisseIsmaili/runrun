const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Add support for additional file extensions if needed
config.resolver.assetExts.push(
  // Add more file extensions here if needed
  'bin'
);

// Configure source extensions
config.resolver.sourceExts.push(
  'jsx',
  'js',
  'ts',
  'tsx',
  'json'
);

module.exports = config;