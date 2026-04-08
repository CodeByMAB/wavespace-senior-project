/**
 * Dynamic Expo config: injects Breez API key from the environment at build/start time.
 * EAS: set `BREEZ_API_KEY` as a secret. Local dev: use `EXPO_PUBLIC_BREEZ_API_KEY` in `.env`
 * or export `BREEZ_API_KEY` before `npx expo start`.
 */
const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo?.extra ?? {}),
      breezApiKey: process.env.BREEZ_API_KEY || process.env.EXPO_PUBLIC_BREEZ_API_KEY || '',
    },
  },
};
