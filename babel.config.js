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
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@data': './src/data',
            '@constants': './src/constants',
            '@types': './src/types',
          },
        },
      ],
    ],
  };
};
