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
        // Base papel (fondo neutro del sitio) — levemente más frío y sobrio
        // que el off-white anterior: lee a papel técnico, no a plantilla.
        canvas: '#F7F8F9',
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
      // Radios casi rectos: lenguaje de ficha técnica / industria, no de app.
      // `pill` se conserva SOLO para el FAB circular y el toggle del mapa.
      borderRadius: {
        sharp: '2px',
        card: '3px',
        pill: '999px',
      },
      // Sombras nítidas y de bajo radio. La estructura la dan los filetes,
      // no el desenfoque. (Sombra grande difusa = tell de plantilla IA.)
      boxShadow: {
        card: '0 1px 2px rgba(4, 43, 69, 0.05)',
        lift: '0 1px 2px rgba(4, 43, 69, 0.06), 0 12px 28px -20px rgba(4, 43, 69, 0.35)',
        cta: '0 1px 2px rgba(4, 43, 69, 0.16)',
      },
      letterSpacing: {
        // Etiqueta técnica en versalitas: el marcador de sección del sitio.
        technical: '0.18em',
      },
      maxWidth: {
        content: '76rem',
      },
    },
  },
  plugins: [],
};

export default config;
