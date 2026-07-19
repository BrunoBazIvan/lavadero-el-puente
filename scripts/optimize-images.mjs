/**
 * Optimiza las fotos reales del lavadero para la web.
 *
 * FLUJO PARA CUANDO LLEGUEN LAS FOTOS:
 *   1. Colocá las fotos originales (JPG/PNG) en   assets/photos/
 *   2. Ejecutá:  npm run optimize-images
 *   3. Se generan versiones AVIF + WebP + JPG (fallback) en  public/images/
 *      redimensionadas a anchos responsive, listas para usar con <img>.
 *
 * Uso en componentes (ejemplo):
 *   <img
 *     src="/images/lavadero-1200.jpg"
 *     srcSet="/images/lavadero-800.webp 800w, /images/lavadero-1200.webp 1200w"
 *     width="1200" height="800" alt="..." loading="lazy" decoding="async" />
 */
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = resolve(root, 'assets/photos');
const outDir = resolve(root, 'public/images');

const WIDTHS = [400, 800, 1200, 1600];
const HERO_MAX_KB = 120;

if (!existsSync(srcDir)) {
  console.log(`No hay carpeta ${srcDir}. Creá "assets/photos" y poné ahí las fotos originales.`);
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

if (files.length === 0) {
  console.log('No se encontraron fotos en assets/photos/. Nada que optimizar.');
  process.exit(0);
}

async function run() {
  for (const file of files) {
    const { name } = parse(file);
    const input = resolve(srcDir, file);
    const meta = await sharp(input).metadata();

    for (const w of WIDTHS) {
      if (meta.width && w > meta.width) continue;
      const base = sharp(input).resize(w, null, { withoutEnlargement: true });
      await base.clone().avif({ quality: 55 }).toFile(resolve(outDir, `${name}-${w}.avif`));
      await base.clone().webp({ quality: 72 }).toFile(resolve(outDir, `${name}-${w}.webp`));
      await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(resolve(outDir, `${name}-${w}.jpg`));
    }
    console.log(`✓ ${file} → AVIF/WebP/JPG en ${WIDTHS.join(', ')}px`);
  }
  console.log(
    `\nListo. Recordá: la imagen del hero debe pesar ≤ ${HERO_MAX_KB}KB y usar fetchpriority="high".`
  );
}

run().catch((err) => {
  console.error('Error optimizando imágenes:', err);
  process.exit(1);
});
