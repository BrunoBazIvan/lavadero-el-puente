import type { MetadataRoute } from 'next';
import { business } from '@/lib/config';
import { landingPages } from '@/lib/landingPages';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${business.domain}/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
    // Páginas de servicio y zona.
    ...landingPages.map((p) => ({
      url: `${business.domain}/${p.slug}/`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: p.kind === 'servicio' ? 0.8 : 0.7,
    })),
    {
      url: `${business.domain}/sobre-nosotros/`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}
