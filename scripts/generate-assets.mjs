/**
 * Genera la imagen social Open Graph a partir del SVG fuente en /assets:
 *   - public/og.png   (1200×630, Open Graph / Twitter)
 *
 * Los favicons (favicon.ico, favicon-16/32, apple-touch-icon y android-chrome-*)
 * son archivos de marca REALES ya provistos en /public (generados desde el logo
 * oficial del Manual de Marca). NO se regeneran acá para no pisarlos.
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

const ogSvg = readFileSync(resolve(root, 'assets/og-source.svg'));

async function run() {
  await sharp(ogSvg).resize(1200, 630).png({ quality: 90 }).toFile(resolve(pub, 'og.png'));
  console.log('✓ og.png generado en /public');
}

run().catch((err) => {
  console.error('Error generando assets:', err);
  process.exit(1);
});
