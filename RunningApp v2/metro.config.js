const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour supporter différentes plateformes
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Configuration des extensions de fichiers supportées
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'jsx',
  'js',
  'ts',
  'tsx',
  'json'
];

// Configuration des assets
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'ttf',
  'otf',
  'woff',
  'woff2'
];

// Configuration pour résoudre le problème ActivityIndicator avec Expo SDK 52
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Désactiver la minification pour éviter les conflits
    mangle: false,
  },
};

// Configuration expérimentale pour Expo SDK 52
config.experimental = {
  ...config.experimental,
  // Activer le nouveau resolver
  unstable_allowRequireContext: true,
};

module.exports = config;