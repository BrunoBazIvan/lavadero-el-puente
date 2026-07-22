import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Tarjeta de servicio clickeable → página de servicio dedicada (enlazado interno
 * para SEO local). La conversión a WhatsApp vive en cada página de servicio y en
 * el CTA de la sección.
 */
export default function ServiceCardLink({
  pageSlug,
  title,
  children,
}: {
  pageSlug: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/${pageSlug}/`}
      aria-label={`Ver servicio: ${title}`}
      className="group flex h-full flex-col rounded-card border border-brand-100 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-aqua-200 hover:shadow-lift"
    >
      {children}
    </Link>
  );
}
