import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Celda de servicio clickeable → página de servicio dedicada (enlazado interno
 * para SEO local). La conversión a WhatsApp vive en cada página de servicio y en
 * el CTA de la sección.
 *
 * Es una celda de la matriz de filetes: sin sombra, sin radio, sin flotar al
 * hover. El estado se marca con fondo + filete inferior de acento.
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
    <Link href={`/${pageSlug}/`} aria-label={`Ver servicio: ${title}`} className="group cell-link">
      {children}
    </Link>
  );
}
