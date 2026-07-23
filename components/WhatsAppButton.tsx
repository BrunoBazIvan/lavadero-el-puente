'use client';

import type { ReactNode } from 'react';
import { buildWhatsAppUrl } from '@/lib/config';
import { trackWhatsAppClick, type WhatsAppSource } from '@/lib/analytics';
import { WhatsAppIcon } from './icons';

type Variant = 'primary' | 'solid' | 'compact' | 'ghost';

/**
 * Componente ÚNICO de conversión a WhatsApp.
 * Todos los caminos de conversión pasan por acá: un solo lugar para el número
 * (via buildWhatsAppUrl) y para el tracking (via trackWhatsAppClick).
 *
 * Geometría recta (radio 2px) y sin desplazamiento al hover: el botón se
 * comporta como un control industrial, no como un CTA de plantilla.
 */
export default function WhatsAppButton({
  source,
  message,
  children,
  variant = 'primary',
  className = '',
  showIcon = true,
}: {
  source: WhatsAppSource;
  message: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  showIcon?: boolean;
}) {
  const base =
    'group/cta inline-flex items-center justify-center gap-2.5 rounded-sharp font-semibold transition-colors duration-150 focus-visible:outline-offset-4 min-h-[44px]';

  const variants: Record<Variant, string> = {
    // CTA grande principal (verde WhatsApp — reservado a conversión).
    primary:
      'bg-whatsapp px-7 py-3.5 text-base text-white shadow-cta hover:bg-whatsapp-dark',
    // CTA sólido tamaño medio.
    solid: 'bg-whatsapp px-5 py-2.5 text-sm text-white shadow-cta hover:bg-whatsapp-dark',
    // Botón compacto del header.
    compact: 'bg-whatsapp px-4 py-2 text-sm text-white hover:bg-whatsapp-dark',
    // Verde sobre fondo claro, con filete (para secciones invertidas).
    ghost:
      'border border-whatsapp bg-white px-6 py-3 text-base text-whatsapp-dark hover:bg-whatsapp hover:text-white',
  };

  return (
    <a
      href={buildWhatsAppUrl(message)}
      target="_blank"
      rel="noopener"
      onClick={() => trackWhatsAppClick(source)}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {showIcon && <WhatsAppIcon className="h-5 w-5 shrink-0" />}
      <span>{children}</span>
    </a>
  );
}
