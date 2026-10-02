'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

type Match = { event: string; extra?: Record<string, string> };

/** Qué evento corresponde a un link, según adónde lleva. */
function classify(href: string): Match | null {
  const h = href.trim().toLowerCase();
  if (h.startsWith('https://wa.me/') || h.includes('api.whatsapp.com/') || h.startsWith('whatsapp:')) {
    return { event: 'whatsapp_click' };
  }
  if (h.startsWith('tel:')) return { event: 'phone_click' };
  if (h.startsWith('mailto:')) return { event: 'email_click' };
  if (h.startsWith('https://www.google.com/maps/dir/')) return { event: 'directions_click' };
  const social = h.match(/^https?:\/\/(?:www\.|m\.)?(instagram|facebook|tiktok|linkedin|youtube)\.com/);
  if (social) return { event: 'social_click', extra: { network: social[1] } };
  return null;
}

/**
 * Mide los clics de conversión de todo el sitio con un solo listener: cada
 * link solo declara dónde está (`data-cta`, en el link o en un contenedor) y,
 * en las páginas de servicio, cuál es (`data-service`).
 *
 * Escucha en captura, así funciona aunque un componente frene la propagación.
 * No demora la navegación: gtag manda con sendBeacon, así que el evento llega
 * aunque se abra WhatsApp. No manda nada que haya escrito la persona.
 */
export default function ConversionTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const a = el?.closest<HTMLAnchorElement>('a[href]');
      if (!a) return;
      const match = classify(a.getAttribute('href') ?? '');
      if (!match) return;
      const cta = a.closest<HTMLElement>('[data-cta]')?.dataset.cta ?? 'unknown';
      const service = a.closest<HTMLElement>('[data-service]')?.dataset.service;
      track(match.event, { cta_location: cta, ...(service ? { service } : {}), ...match.extra });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
