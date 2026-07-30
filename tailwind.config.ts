import type { Config } from 'tailwindcss';

/**
 * Paleta y tipografía del manual de marca de El Puente, igual que la landing.
 * La diferencia es el uso: esto es una herramienta de mostrador, no una pieza
 * de marketing. Alto contraste, densidad de información, botones grandes.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F6F8',
        ink: '#0D0D0D',
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
        aqua: {
          50: '#EAF8FB',
          100: '#C9EEF5',
          200: '#96DEEA',
          300: '#43BDD9', // Celeste Agua (manual)
          400: '#28A7C7',
          500: '#1F92BF', // Azul Océano (manual)
          600: '#1A7A9E',
        },
        // Semáforo de estados. Sobrio a propósito: tiene que leerse de un
        // vistazo desde el otro lado del mostrador, no decorar.
        estado: {
          recibido: '#64748B',
          proceso: '#1F92BF',
          listo: '#15803D',
          entregado: '#042B45',
          anulado: '#B91C1C',
        },
        alerta: '#B91C1C',
        ok: '#15803D',
        aviso: '#B45309',
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['Lato', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Mismos dos radios que la landing: lenguaje de ficha técnica.
      borderRadius: {
        sharp: '2px',
        card: '3px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(4, 43, 69, 0.06)',
        modal: '0 1px 2px rgba(4, 43, 69, 0.10), 0 16px 40px -24px rgba(4, 43, 69, 0.45)',
      },
      letterSpacing: {
        technical: '0.18em',
      },
    },
  },
  plugins: [],
};

export default config;
