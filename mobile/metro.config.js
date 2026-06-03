const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Allow mp4 video files to be bundled as assets
config.resolver.assetExts.push('mp4');

module.exports = withNativeWind(config, { input: './src/global.css' });

