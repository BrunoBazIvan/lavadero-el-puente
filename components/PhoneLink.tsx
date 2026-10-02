import type { ReactNode } from 'react';
import { business } from '@/lib/config';
import type { CtaLocation } from '@/lib/analytics';
import { PhoneIcon } from './icons';

/** Enlace tel: clickeable. `cta` es su ubicación para el evento `phone_click`. */
export default function PhoneLink({
  cta,
  className = '',
  children,
  showIcon = true,
}: {
  cta: CtaLocation;
  className?: string;
  children?: ReactNode;
  showIcon?: boolean;
}) {
  return (
    <a
      href={`tel:${business.phoneTel}`}
      data-cta={cta}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {showIcon && <PhoneIcon className="h-4 w-4 shrink-0" />}
      <span>{children ?? business.phoneDisplay}</span>
    </a>
  );
}
