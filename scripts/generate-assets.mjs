/**
 * Genera los assets rasterizados (PNG) a partir de los SVG fuente en /assets:
 *   - public/og.png              (1200×630, Open Graph / Twitter)
 *   - public/apple-touch-icon.png (180×180)
 *   - public/icon-192.png / icon-512.png (PWA / Android)
 *   - public/favicon.ico         (32×32, generado como PNG dentro de .ico)
 *
 * Ejecutar:  node scripts/generate-assets.mjs
 * Se corre también automáticamente en `npm run build` (ver prebuild).
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');
mkdirSync(pub, { recursive: true });

const favSvg = readFileSync(resolve(root, 'assets/favicon-source.svg'));
const ogSvg = readFileSync(resolve(root, 'assets/og-source.svg'));

async function run() {
  await sharp(ogSvg).resize(1200, 630).png({ quality: 90 }).toFile(resolve(pub, 'og.png'));
  await sharp(favSvg).resize(180, 180).png().toFile(resolve(pub, 'apple-touch-icon.png'));
  await sharp(favSvg).resize(192, 192).png().toFile(resolve(pub, 'icon-192.png'));
  await sharp(favSvg).resize(512, 512).png().toFile(resolve(pub, 'icon-512.png'));
  // .ico como PNG de 32px (aceptado por navegadores modernos).
  await sharp(favSvg).resize(32, 32).png().toFile(resolve(pub, 'favicon.ico'));
  console.log('✓ Assets generados en /public');
}

run().catch((err) => {
  console.error('Error generando assets:', err);
  process.exit(1);
});
