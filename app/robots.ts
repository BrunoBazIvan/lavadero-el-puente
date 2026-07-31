import type { MetadataRoute } from 'next';
import { business } from '@/lib/config';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    // /gestion/ es la herramienta interna de mostrador: nada que indexar ahí.
    rules: { userAgent: '*', allow: '/', disallow: '/gestion/' },
    sitemap: `${business.domain}/sitemap.xml`,
    host: business.domain,
  };
}
