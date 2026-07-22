import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { business } from '@/lib/config';
import { landingSlugs, getLandingPage } from '@/lib/landingPages';
import LandingTemplate from '@/components/landing/LandingTemplate';

/** Pre-renderiza una URL estática por cada página de servicio/zona. */
export function generateStaticParams() {
  return landingSlugs.map((slug) => ({ slug }));
}

/** Solo estos slugs son válidos (el resto → 404). */
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = getLandingPage(params.slug);
  if (!page) return {};

  const url = `/${page.slug}/`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'es_UY',
      url,
      siteName: business.name,
      title: page.metaTitle,
      description: page.metaDescription,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: business.name }],
    },
    robots: { index: true, follow: true },
  };
}

export default function LandingPageRoute({ params }: { params: { slug: string } }) {
  const page = getLandingPage(params.slug);
  if (!page) notFound();
  return <LandingTemplate page={page} />;
}
