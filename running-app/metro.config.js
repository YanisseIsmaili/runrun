const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Résoudre les problèmes de polyfills
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  setimmediate: require.resolve('setimmediate'),
};

module.exports = config;
