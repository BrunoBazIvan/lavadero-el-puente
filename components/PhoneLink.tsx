'use client';

import type { ReactNode } from 'react';
import { business } from '@/lib/config';
import { trackPhoneClick } from '@/lib/analytics';
import { PhoneIcon } from './icons';

/** Enlace tel: clickeable con tracking. Para quienes prefieren llamar. */
export default function PhoneLink({
  className = '',
  children,
  showIcon = true,
}: {
  className?: string;
  children?: ReactNode;
  showIcon?: boolean;
}) {
  return (
    <a
      href={`tel:${business.phoneTel}`}
      onClick={() => trackPhoneClick()}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {showIcon && <PhoneIcon className="h-4 w-4 shrink-0" />}
      <span>{children ?? business.phoneDisplay}</span>
    </a>
  );
}
