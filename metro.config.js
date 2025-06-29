// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.useWatchman = false;

// Add support for local Turbo Modules
config.resolver.unstable_enableSymlinks = true;

// Add local modules to watchFolders
config.watchFolders = [
  path.resolve(__dirname, 'modules'),
];

// Ensure we can resolve modules from the modules directory
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'modules'),
];

// Add support for TypeScript in modules
config.resolver.sourceExts.push('ts', 'tsx');

// Ensure proper resolution of the modules
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main',
];

// Add Turbo Module support
config.transformer.unstable_allowRequireContext = true;

module.exports = withNativeWind(config, { input: './global.css' });