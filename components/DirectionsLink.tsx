'use client';

import { mapsDirectionsUrl } from '@/lib/config';
import { trackDirectionsClick } from '@/lib/analytics';
import { PinIcon } from './icons';

/** Botón "Cómo llegar" → Google Maps, con tracking. */
export default function DirectionsLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={mapsDirectionsUrl}
      target="_blank"
      rel="noopener"
      onClick={() => trackDirectionsClick()}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill border border-brand-200 bg-white px-6 py-3 text-base font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50 ${className}`}
    >
      <PinIcon className="h-5 w-5" />
      Cómo llegar
    </a>
  );
}
