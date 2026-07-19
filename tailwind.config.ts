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
        // Base off-white
        canvas: '#FAFAF8',
        // Azul profundo de marca (ajustar al azul del logo real)
        brand: {
          50: '#EAF1F8',
          100: '#CBDDEF',
          200: '#9BBCDD',
          300: '#5F8FC2',
          400: '#2E63A0',
          500: '#0E3E6E',
          600: '#0B355F',
          700: '#0A2C4F',
          800: '#08233F',
          900: '#061A2F',
        },
        // Acento inesperado: celeste agua (hovers, detalles, motivo gráfico)
        aqua: {
          50: '#E8FAFB',
          100: '#C4F1F4',
          200: '#8FE3E9',
          300: '#4ECEDA',
          400: '#22B6C6',
          500: '#1194A3',
          600: '#0D7684',
        },
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
