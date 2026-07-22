import type { Metadata, Viewport } from 'next';
import { Montserrat, Lato } from 'next/font/google';
import './globals.css';
import { business } from '@/lib/config';
import { localBusinessJsonLd } from '@/lib/jsonld';
import Analytics from '@/components/Analytics';

// Tipografías del Manual de Marca El Puente: Montserrat (títulos y destacados)
// + Lato (texto corrido). Self-hosted por next/font (cero requests externos,
// cero layout shift).
const display = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
  display: 'swap',
});

const title = 'Lavandería en Maldonado | Lavadero Industrial El Puente';
const description =
  'Lavadero industrial y lavandería en Maldonado y Punta del Este. Acolchados, cortinas, alfombras, ropa y ropa blanca para hoteles. Escribinos por WhatsApp.';

export const metadata: Metadata = {
  metadataBase: new URL(business.domain),
  title,
  description,
  alternates: { canonical: '/' },
  keywords: [
    'lavadero maldonado',
    'lavadero industrial maldonado',
    'lavandería maldonado',
    'limpieza de acolchados maldonado',
    'lavado de cortinas maldonado',
    'limpieza de alfombras punta del este',
    'lavandería para hoteles punta del este',
    'lavadero punta del este',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_UY',
    url: '/',
    siteName: business.name,
    title,
    description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: business.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#07598C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-UY" className={`${display.variable} ${body.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
