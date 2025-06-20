const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Désactiver les package.json exports si problème avec SDK 53
config.resolver.unstable_enablePackageExports = false;

// Configuration pour Expo SDK 53
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Extensions de fichiers supportées
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'jsx',
  'js',
  'ts',
  'tsx',
  'json',
  'mjs',
];

// Extensions d'assets supportées
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'ttf',
  'otf',
  'woff',
  'woff2',
  'mp3',
  'wav',
  'mp4',
  'mov',
];

// Configuration pour les alias de modules
config.resolver.alias = {
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@context': './src/context',
  '@services': './src/services',
  '@utils': './src/utils',
  '@assets': './assets',
};

module.exports = config;