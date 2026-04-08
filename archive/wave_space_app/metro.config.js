const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [],
  watcher: {
    watchman: {
      enabled: false,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
