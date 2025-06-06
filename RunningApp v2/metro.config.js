const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Patch pour ActivityIndicator size="large"
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Transformer pour remplacer size="large" par size={40}
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('./transformer.js'),
};

module.exports = config;