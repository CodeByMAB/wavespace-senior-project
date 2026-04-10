/**
 * Builds assets/images/logo-app-icon.png for Expo / iOS launcher.
 * Composites assets/images/logo.png on Bitcoin orange (#F7931A) — see src/theme/colors.ts primary.
 * Run: npm run generate:app-icon
 */
const path = require('path');
const { Jimp } = require('jimp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets/images/logo.png');
const OUT = path.join(ROOT, 'assets/images/logo-app-icon.png');

/** colors.primary */
const BRAND_ORANGE = 0xf7931aff;
const SIZE = 1024;
const LOGO_MAX = Math.round(SIZE * 0.86);

(async () => {
  const logo = await Jimp.read(SRC);
  const canvas = new Jimp({ width: SIZE, height: SIZE, color: BRAND_ORANGE });
  const mark = logo.clone();
  await mark.contain({ w: LOGO_MAX, h: LOGO_MAX });
  canvas.composite(
    mark,
    Math.round((SIZE - mark.width) / 2),
    Math.round((SIZE - mark.height) / 2),
  );
  canvas.scan(0, 0, canvas.width, canvas.height, function (_x, _y, idx) {
    this.bitmap.data[idx + 3] = 255;
  });
  await canvas.write(OUT);
  console.log('Wrote', OUT);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
