const path = require('path');

// Hydrate `process.env` from `.env*` before reading keys (covers tooling paths where
// config is evaluated before Expo CLI’s usual env pass).
try {
  const { loadProjectEnv } = require('@expo/env');
  loadProjectEnv(path.resolve(__dirname), { silent: true });
} catch {
  // ignore if @expo/env is unavailable
}

/**
 * Dynamic Expo config: injects Breez API key from the environment at build/start time.
 * EAS: set `BREEZ_API_KEY` as a secret. Local dev: use `EXPO_PUBLIC_BREEZ_API_KEY` in `.env`
 * or export `BREEZ_API_KEY` before `npx expo start`.
 *
 * EAS sets `EAS_BUILD_PROFILE` during cloud builds — used to label non-production installs
 * (home screen name, in-app banner, About).
 *
 * `expo.name` becomes the Xcode target / PRODUCT_NAME during prebuild. It must stay stable
 * (`Wavespace`) so EAS provisioning and existing native projects keep matching the
 * `Wavespace` target. Store- and home-screen-facing titles come from `app.json` →
 * `CFBundleDisplayName` (iOS) and `app_name` in Android `strings.xml` (plugin below).
 */
const { AndroidConfig, withStringsXml } = require('expo/config-plugins');

const appJson = require('./app.json');

/** Matches the historical Xcode native target and EAS credential mapping. */
const NATIVE_PRODUCT_NAME = 'Wavespace';

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

function withAndroidAppDisplayName(config) {
  const label = displayName(appJson.expo.name);
  return withStringsXml(config, (mod) => {
    mod.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name' }, _: label }],
      mod.modResults
    );
    return mod;
  });
}

const { plugins: basePlugins = [], ios: baseIos = {}, ...restExpo } = appJson.expo;

/** Baked into the native binary’s manifest during `eas build` (not patched by Metro later). */
const breezApiKey = (
  process.env.BREEZ_API_KEY ||
  process.env.EXPO_PUBLIC_BREEZ_API_KEY ||
  ''
).trim();

if (process.env.EAS_BUILD === 'true' && !breezApiKey) {
  throw new Error(
    'EAS build: no Breez API key. Add a project secret and rebuild: eas secret:create --name BREEZ_API_KEY --value "<your-key>" --type string',
  );
}

module.exports = {
  expo: {
    ...restExpo,
    name: NATIVE_PRODUCT_NAME,
    ios: {
      ...baseIos,
      infoPlist: {
        ...(baseIos.infoPlist ?? {}),
        CFBundleDisplayName: displayName(appJson.expo.name),
      },
    },
    plugins: [...basePlugins, withAndroidAppDisplayName],
    extra: {
      ...(appJson.expo?.extra ?? {}),
      breezApiKey,
      releaseStage: releaseStage(),
      easBuildProfile: easProfile ?? null,
    },
  },
};
