import type { MetadataRoute } from 'next';
import { business } from '@/lib/config';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${business.domain}/sitemap.xml`,
    host: business.domain,
  };
}
