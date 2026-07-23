'use client';

import { useState } from 'react';
import { mapsEmbedUrl } from '@/lib/config';
import { PinIcon } from './icons';

/**
 * Facade del mapa: muestra una imagen/placeholder liviano y solo carga el iframe
 * de Google Maps cuando el usuario hace clic (mejor LCP, no bloquea el hilo).
 */
export default function MapFacade({ title }: { title: string }) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        title={title}
        src={mapsEmbedUrl}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label="Cargar mapa de Google con la ubicación del lavadero"
      className="group relative flex h-full w-full flex-col items-center justify-center gap-4 bg-brand-50 transition-colors hover:bg-brand-100/60"
    >
      <div className="map-grid absolute inset-0" aria-hidden="true" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-sharp bg-brand-800 text-white">
        <PinIcon className="h-6 w-6" />
      </span>
      <span className="relative font-display text-[0.6875rem] font-bold uppercase tracking-technical text-brand-700">
        Ver mapa
      </span>
    </button>
  );
}
