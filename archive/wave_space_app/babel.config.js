module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@context': './src/context',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@data': './src/data',
            '@assets': './src/assets',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
