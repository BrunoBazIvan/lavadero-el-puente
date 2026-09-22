import type { Metadata } from 'next';
import { business } from '@/lib/config';
import { getLegalPage } from '@/lib/legalContent';
import LegalPageTemplate from '@/components/legal/LegalPageTemplate';

const page = getLegalPage('politica-de-cookies')!;

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: `/${page.slug}/` },
  openGraph: {
    type: 'website',
    locale: 'es_UY',
    url: `/${page.slug}/`,
    siteName: business.name,
    title: page.metaTitle,
    description: page.metaDescription,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: business.name }],
  },
  robots: { index: true, follow: true },
};

export default function PoliticaDeCookies() {
  return <LegalPageTemplate page={page} />;
}
