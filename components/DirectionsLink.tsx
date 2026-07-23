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
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sharp border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:text-brand-800 ${className}`}
    >
      <PinIcon className="h-5 w-5" />
      Cómo llegar
    </a>
  );
}
