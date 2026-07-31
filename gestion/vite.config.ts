import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // La app se sirve como una subcarpeta del sitio de la landing, no en la raíz.
  // De acá sale `import.meta.env.BASE_URL`, que usan el router y el mail de
  // recuperar contraseña.
  base: '/gestion/',

  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // El build va al `public/` de la landing: `next build` con `output: export`
    // copia esa carpeta tal cual dentro de `out/`, así que la app termina
    // publicada en /gestion/ con el mismo deploy.
    outDir: '../public/gestion',
    // Vite se niega a vaciar un outDir fuera de su root si no se lo pedís.
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
