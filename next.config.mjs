/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera un sitio 100% estático en /out (HTML completo para crawlers, deploy gratis).
  output: 'export',

  // En modo export el optimizador de imágenes de Next no está disponible.
  // Usamos imágenes pre-optimizadas en build (ver scripts/optimize-images.mjs).
  images: {
    unoptimized: true,
  },

  // URLs con barra final => carpetas /ruta/index.html (más robusto en hosting estático).
  trailingSlash: true,

  reactStrictMode: true,
};

export default nextConfig;
