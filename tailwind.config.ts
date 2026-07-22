import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base off-white (fondo neutro del sitio).
        canvas: '#FAFAF8',
        // Negro Tinta del manual — textos oscuros y detalles.
        ink: '#0D0D0D',
        // Marca — escala construida alrededor del "Azul Profundo" #07598C (500).
        brand: {
          50: '#EAF3F9',
          100: '#CBE1EE',
          200: '#9BC6DE',
          300: '#5F9EC4',
          400: '#2E79A8',
          500: '#07598C', // Azul Profundo (manual)
          600: '#064A75',
          700: '#053A5D',
          800: '#042B45',
          900: '#031C2E',
        },
        // Acento agua — "Celeste Agua" #43BDD9 (300) y "Azul Océano" #1F92BF (500).
        aqua: {
          50: '#EAF8FB',
          100: '#C9EEF5',
          200: '#96DEEA',
          300: '#43BDD9', // Celeste Agua (manual)
          400: '#28A7C7',
          500: '#1F92BF', // Azul Océano (manual)
          600: '#1A7A9E',
        },
        // "Azul Eléctrico" del manual — acento puntual de alto impacto, uso muy medido.
        electric: '#0511F2',
        // Verde WhatsApp — EXCLUSIVO para CTAs de conversión. No usar en ningún otro lado.
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#1DA851',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px',
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(6, 26, 47, 0.18)',
        lift: '0 20px 45px -15px rgba(6, 26, 47, 0.28)',
        cta: '0 12px 28px -8px rgba(37, 211, 102, 0.5)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};

export default config;
