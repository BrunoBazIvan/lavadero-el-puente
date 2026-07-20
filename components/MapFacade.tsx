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
      className="group relative flex h-full w-full flex-col items-center justify-center gap-3 bg-brand-50"
    >
      <div className="bubbles-bg absolute inset-0 opacity-40" aria-hidden="true" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-card transition-transform group-hover:scale-105">
        <PinIcon className="h-7 w-7" />
      </span>
      <span className="relative text-sm font-semibold text-brand-700">Ver mapa</span>
    </button>
  );
}
