/**
 * Dynamic Expo config: injects Breez API key from the environment at build/start time.
 * EAS: set `BREEZ_API_KEY` as a secret. Local dev: use `EXPO_PUBLIC_BREEZ_API_KEY` in `.env`
 * or export `BREEZ_API_KEY` before `npx expo start`.
 *
 * EAS sets `EAS_BUILD_PROFILE` during cloud builds — used to label non-production installs
 * (home screen name, in-app banner, About).
 */
const appJson = require('./app.json');

const easProfile = process.env.EAS_BUILD_PROFILE;

function displayName(base) {
  if (easProfile === 'development') return `${base} (Dev)`;
  if (easProfile === 'preview') return `${base} (Preview)`;
  return base;
}

/** @type {'development' | 'preview' | 'production' | undefined} */
function releaseStage() {
  if (easProfile === 'development' || easProfile === 'preview' || easProfile === 'production') {
    return easProfile;
  }
  return undefined;
}

module.exports = {
  expo: {
    ...appJson.expo,
    name: displayName(appJson.expo.name),
    extra: {
      ...(appJson.expo?.extra ?? {}),
      breezApiKey: process.env.BREEZ_API_KEY || process.env.EXPO_PUBLIC_BREEZ_API_KEY || '',
      releaseStage: releaseStage(),
      easBuildProfile: easProfile ?? null,
    },
  },
};
