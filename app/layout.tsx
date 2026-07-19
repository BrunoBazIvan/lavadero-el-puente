import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { business } from '@/lib/config';
import { localBusinessJsonLd, faqJsonLd } from '@/lib/jsonld';
import Analytics from '@/components/Analytics';

// Fuentes self-hosted por next/font (cero requests externos, cero layout shift).
const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const title = 'Lavadero El Puente | Lavadero Industrial y Lavandería en Maldonado';
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0E3E6E',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
