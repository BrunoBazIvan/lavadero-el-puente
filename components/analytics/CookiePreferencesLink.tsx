'use client';

import { useEffect, useState } from 'react';
import { analyticsAllowedHere, reopenConsentBanner } from '@/lib/analytics';

/**
 * "Preferencias de cookies" del footer: borra la elección y vuelve a mostrar
 * el aviso. Solo se dibuja donde hay analítica (producción); en localhost o en
 * una preview no habría aviso que abrir y el link parecería roto.
 */
export default function CookiePreferencesLink({ className = '' }: { className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => setShow(analyticsAllowedHere()), []);

  if (!show) return null;

  return (
    <button type="button" onClick={reopenConsentBanner} className={className}>
      Preferencias de cookies
    </button>
  );
}
