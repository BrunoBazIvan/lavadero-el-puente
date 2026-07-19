'use client';

import type { ReactNode } from 'react';
import { buildWhatsAppUrl } from '@/lib/config';
import { trackWhatsAppClick } from '@/lib/analytics';

/** Tarjeta de servicio 100% clickeable → WhatsApp, con tracking por servicio. */
export default function ServiceCardLink({
  slug,
  message,
  title,
  children,
}: {
  slug: string;
  message: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <a
      href={buildWhatsAppUrl(message)}
      target="_blank"
      rel="noopener"
      aria-label={`Consultar por ${title} por WhatsApp`}
      onClick={() => trackWhatsAppClick(`servicio_${slug}`)}
      className="group flex h-full flex-col rounded-card border border-brand-100 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-aqua-200 hover:shadow-lift"
    >
      {children}
    </a>
  );
}
